package com.sc.community.service;

import com.sc.community.dto.AuthResponse;
import com.sc.community.dto.LoginRequest;
import com.sc.community.dto.RegisterRequest;
import com.sc.community.dto.UserResponse;
import com.sc.community.entity.User;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.VerificationCode;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final OtpChallengeRepository challengeRepository;
    private final DirectoryService directoryService;

    public AuthService(
            UserRepository userRepository,
            VerificationCodeRepository codeRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            OtpService otpService,
            OtpChallengeRepository challengeRepository,
            DirectoryService directoryService) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.challengeRepository = challengeRepository;
        this.directoryService = directoryService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = otpService.normalizeDestination(OtpChannel.EMAIL, request.email());
        String phoneNumber = otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered");
        }

        VerificationCode code = codeRepository.findByCode(request.inviteCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code"));
        if (code.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has already been used");
        }
        OtpChallenge inviteRequest = challengeRepository
                .findTopByCodeHashAndPurposeAndDestinationStartingWithOrderByCreatedAtDesc(
                        code.getCode(), OtpPurpose.PASSWORD_RESET, "INVITE\n")
                .orElse(null);
        if (inviteRequest != null) {
            if (!InviteRequestService.matchesIdentity(inviteRequest, email, phoneNumber)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "This invite code belongs to a different verified applicant");
            }
        }

        otpService.consumeVerification(
                request.emailVerificationToken(), OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, email);
        otpService.consumeVerification(
                request.phoneVerificationToken(), OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, phoneNumber);

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(phoneNumber);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.ROLE_USER);
        user.setStatus(UserStatus.VERIFIED);
        String idProofUrl = request.idProofUrl() == null ? "" : request.idProofUrl().trim();
        user.setIdProofUrl(idProofUrl.isBlank() ? null : idProofUrl);
        user.setInviteCodeUsed(code.getCode());
        user.setProfessionalGroup(request.professionalGroup());
        User saved = userRepository.save(user);
        directoryService.saveHelpFields(saved, request.helpFieldIds());

        code.setUsed(true);
        code.setUsedByUser(saved);
        codeRepository.save(code);
        if (inviteRequest != null) {
            inviteRequest.setUsedAt(java.time.Instant.now());
            challengeRepository.save(inviteRequest);
        }
        return UserResponse.from(saved);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is blocked");
        }
        if (user.getStatus() != UserStatus.VERIFIED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is pending admin approval");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (BadCredentialsException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        directoryService.populateHelpFields(user);

        return new AuthResponse(
                jwtService.generateToken(user),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getProfessionalGroup() == null ? ProfessionalGroup.COMMUNITY : user.getProfessionalGroup(),
                user.getHelpFields().stream().sorted(java.util.Comparator.comparingInt(field -> field.getDisplayOrder()))
                        .map(field -> field.getId()).toList(),
                user.getHelpFields().stream().sorted(java.util.Comparator.comparingInt(field -> field.getDisplayOrder()))
                        .map(field -> field.getName()).toList(),
                user.isProfileComplete()
        );
    }
}
