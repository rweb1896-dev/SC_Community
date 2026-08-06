package com.sc.community.service;

import com.sc.community.dto.OtpDtos.MessageResponse;
import com.sc.community.dto.OtpDtos.OtpRequest;
import com.sc.community.dto.OtpDtos.OtpRequestResponse;
import com.sc.community.dto.OtpDtos.OtpVerifyRequest;
import com.sc.community.dto.OtpDtos.OtpVerifyResponse;
import com.sc.community.dto.OtpDtos.PasswordResetRequest;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.User;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OtpService {
    private static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String emailCode;
    private final String mobileCode;
    private final boolean exposeCode;
    private final Duration expiry;
    private final Duration resendCooldown;

    public OtpService(
            OtpChallengeRepository challengeRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.otp.email-code:SC1E}") String emailCode,
            @Value("${app.otp.mobile-code:SC2M}") String mobileCode,
            @Value("${app.otp.expose-code:true}") boolean exposeCode,
            @Value("${app.otp.expiry-minutes:10}") long expiryMinutes,
            @Value("${app.otp.resend-cooldown-seconds:30}") long resendCooldownSeconds) {
        this.challengeRepository = challengeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailCode = normalizeConfiguredCode(emailCode);
        this.mobileCode = normalizeConfiguredCode(mobileCode);
        this.exposeCode = exposeCode;
        this.expiry = Duration.ofMinutes(expiryMinutes);
        this.resendCooldown = Duration.ofSeconds(resendCooldownSeconds);
    }

    @Transactional
    public OtpRequestResponse request(OtpRequest request) {
        validateChannelPurpose(request.channel(), request.purpose());
        String destination = normalizeDestination(request.channel(), request.destination());
        validateDestination(request.channel(), destination);

        if (request.purpose() == OtpPurpose.PASSWORD_RESET && findUser(request.channel(), destination) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for these details");
        }

        Instant now = Instant.now();
        challengeRepository
                .findTopByDestinationAndChannelAndPurposeOrderByCreatedAtDesc(
                        destination, request.channel(), request.purpose())
                .filter(challenge -> challenge.getCreatedAt().plus(resendCooldown).isAfter(now))
                .ifPresent(challenge -> {
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait before requesting another OTP");
                });

        String configuredCode = request.channel() == OtpChannel.EMAIL ? emailCode : mobileCode;
        String code = configuredCode.isBlank() ? randomCode() : configuredCode;
        OtpChallenge challenge = new OtpChallenge();
        challenge.setDestination(destination);
        challenge.setChannel(request.channel());
        challenge.setPurpose(request.purpose());
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(now.plus(expiry));
        challengeRepository.save(challenge);

        String channelName = request.channel() == OtpChannel.EMAIL ? "email" : "mobile";
        return new OtpRequestResponse(
                "Verification code generated for your " + channelName,
                challenge.getExpiresAt(),
                exposeCode ? code : null);
    }

    @Transactional
    public OtpVerifyResponse verify(OtpVerifyRequest request) {
        validateChannelPurpose(request.channel(), request.purpose());
        String destination = normalizeDestination(request.channel(), request.destination());
        OtpChallenge challenge = challengeRepository
                .findTopByDestinationAndChannelAndPurposeOrderByCreatedAtDesc(
                        destination, request.channel(), request.purpose())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request an OTP first"));

        validateActiveChallenge(challenge);
        if (challenge.getAttempts() >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many incorrect attempts");
        }

        String submittedCode = request.code().trim().toUpperCase(Locale.ROOT);
        if (!passwordEncoder.matches(submittedCode, challenge.getCodeHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            challengeRepository.save(challenge);
            int remaining = Math.max(0, MAX_ATTEMPTS - challenge.getAttempts());
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Incorrect OTP. " + remaining + " attempt(s) remaining");
        }

        challenge.setVerifiedAt(Instant.now());
        challenge.setVerificationToken(UUID.randomUUID().toString().replace("-", ""));
        challengeRepository.save(challenge);
        return new OtpVerifyResponse(challenge.getVerificationToken(), challenge.getExpiresAt());
    }

    @Transactional
    public void consumeVerification(
            String verificationToken,
            OtpChannel channel,
            OtpPurpose purpose,
            String destination) {
        OtpChallenge challenge = requireVerifiedToken(verificationToken, purpose);
        String normalizedDestination = normalizeDestination(channel, destination);
        if (challenge.getChannel() != channel || !challenge.getDestination().equals(normalizedDestination)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification does not match your details");
        }
        challenge.setUsedAt(Instant.now());
        challengeRepository.save(challenge);
    }

    @Transactional
    public MessageResponse resetPassword(PasswordResetRequest request) {
        OtpChallenge challenge = requireVerifiedToken(request.resetToken(), OtpPurpose.PASSWORD_RESET);
        User user = findUser(challenge.getChannel(), challenge.getDestination());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Account no longer exists");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        challenge.setUsedAt(Instant.now());
        challengeRepository.save(challenge);
        return new MessageResponse("Password updated successfully");
    }

    public String normalizeDestination(OtpChannel channel, String destination) {
        if (destination == null) {
            return "";
        }
        String value = destination.trim();
        if (channel == OtpChannel.EMAIL) {
            return value.toLowerCase(Locale.ROOT);
        }
        return value.replaceAll("[\\s()\\-]", "");
    }

    private OtpChallenge requireVerifiedToken(String token, OtpPurpose purpose) {
        OtpChallenge challenge = challengeRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification has expired"));
        validateActiveChallenge(challenge);
        if (challenge.getPurpose() != purpose || challenge.getVerifiedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification is incomplete");
        }
        return challenge;
    }

    private void validateActiveChallenge(OtpChallenge challenge) {
        if (challenge.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification has already been used");
        }
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Request a new code");
        }
    }

    private User findUser(OtpChannel channel, String destination) {
        return channel == OtpChannel.EMAIL
                ? userRepository.findByEmail(destination).orElse(null)
                : userRepository.findByPhoneNumber(destination).orElse(null);
    }

    private void validateChannelPurpose(OtpChannel channel, OtpPurpose purpose) {
        if (purpose == OtpPurpose.SIGNUP_EMAIL && channel != OtpChannel.EMAIL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email verification requires email channel");
        }
        if (purpose == OtpPurpose.SIGNUP_MOBILE && channel != OtpChannel.MOBILE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mobile verification requires mobile channel");
        }
    }

    private void validateDestination(OtpChannel channel, String destination) {
        boolean valid = channel == OtpChannel.EMAIL
                ? destination.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                : destination.matches("^\\+?[1-9]\\d{9,14}$");
        if (!valid) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    channel == OtpChannel.EMAIL ? "Enter a valid email address" : "Enter a valid mobile number");
        }
    }

    private String randomCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String normalizeConfiguredCode(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }
}
