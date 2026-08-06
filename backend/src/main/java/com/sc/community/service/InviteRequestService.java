package com.sc.community.service;

import com.sc.community.dto.InviteRequestDtos.CreateInviteRequest;
import com.sc.community.dto.InviteRequestDtos.InviteRequestResponse;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.OtpChallengeRepository;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InviteRequestService {
    private static final String PENDING = "PENDING";
    private static final String INVITE_PREFIX = "INVITE\n";
    private static final Duration REQUEST_LIFETIME = Duration.ofDays(30);

    private final OtpChallengeRepository challengeRepository;
    private final OtpService otpService;
    private final AdminService adminService;

    public InviteRequestService(
            OtpChallengeRepository challengeRepository,
            OtpService otpService,
            AdminService adminService) {
        this.challengeRepository = challengeRepository;
        this.otpService = otpService;
        this.adminService = adminService;
    }

    @Transactional
    public InviteRequestResponse create(CreateInviteRequest request) {
        String email = otpService.normalizeDestination(OtpChannel.EMAIL, request.email());
        String phoneNumber = otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber());
        otpService.validateVerification(
                request.emailVerificationToken(), OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, email);
        otpService.validateVerification(
                request.phoneVerificationToken(), OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, phoneNumber);

        List<OtpChallenge> pending = challengeRepository
                .findByPurposeAndDestinationStartingWithAndVerifiedAtIsNullAndUsedAtIsNullOrderByCreatedAtAsc(
                        OtpPurpose.PASSWORD_RESET, INVITE_PREFIX);
        OtpChallenge existing = pending.stream()
                .filter(challenge -> matchesIdentity(challenge, email, phoneNumber))
                .findFirst()
                .orElse(null);
        if (existing != null) return response(existing);

        OtpChallenge challenge = new OtpChallenge();
        challenge.setDestination(identity(email, phoneNumber, request.fullName()));
        challenge.setChannel(OtpChannel.EMAIL);
        challenge.setPurpose(OtpPurpose.PASSWORD_RESET);
        challenge.setCodeHash(PENDING);
        challenge.setVerificationToken(UUID.randomUUID().toString().replace("-", ""));
        challenge.setExpiresAt(Instant.now().plus(REQUEST_LIFETIME));
        return response(challengeRepository.save(challenge));
    }

    public InviteRequestResponse status(String requestToken) {
        return response(challengeRepository.findByVerificationTokenAndPurposeAndDestinationStartingWith(
                        requestToken, OtpPurpose.PASSWORD_RESET, INVITE_PREFIX)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite request not found")));
    }

    public List<InviteRequestResponse> pending() {
        return challengeRepository
                .findByPurposeAndDestinationStartingWithAndVerifiedAtIsNullAndUsedAtIsNullOrderByCreatedAtAsc(
                        OtpPurpose.PASSWORD_RESET, INVITE_PREFIX)
                .stream()
                .map(this::response)
                .toList();
    }

    @Transactional
    public InviteRequestResponse approve(Long requestId) {
        OtpChallenge challenge = challengeRepository.findById(requestId)
                .filter(item -> item.getPurpose() == OtpPurpose.PASSWORD_RESET)
                .filter(item -> item.getDestination().startsWith(INVITE_PREFIX))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite request not found"));
        if (challenge.getVerifiedAt() != null) return response(challenge);

        VerificationCode code = adminService.createInviteCode();
        challenge.setCodeHash(code.getCode());
        challenge.setVerifiedAt(Instant.now());
        return response(challengeRepository.save(challenge));
    }

    public static boolean matchesIdentity(OtpChallenge challenge, String email, String phoneNumber) {
        String[] identity = identityParts(challenge);
        return identity.length == 4 && identity[1].equals(email) && identity[2].equals(phoneNumber);
    }

    private InviteRequestResponse response(OtpChallenge challenge) {
        String[] identity = identityParts(challenge);
        if (identity.length != 4 || !"INVITE".equals(identity[0])) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invite request data is invalid");
        }
        boolean approved = challenge.getVerifiedAt() != null;
        return new InviteRequestResponse(
                challenge.getId(),
                challenge.getVerificationToken(),
                identity[3],
                identity[1],
                identity[2],
                approved ? "APPROVED" : PENDING,
                approved ? challenge.getCodeHash() : null,
                challenge.getCreatedAt(),
                challenge.getVerifiedAt());
    }

    private static String identity(String email, String phoneNumber, String fullName) {
        String normalizedName = fullName.trim().replaceAll("\\s+", " ");
        return String.join("\n", "INVITE", email, phoneNumber, normalizedName);
    }

    private static String[] identityParts(OtpChallenge challenge) {
        return challenge.getDestination().split("\\n", 4);
    }
}
