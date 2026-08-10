package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.dto.RegisterRequest;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.User;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.security.JwtService;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private VerificationCodeRepository codeRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;
    @Mock private OtpService otpService;
    @Mock private OtpChallengeRepository challengeRepository;
    @Mock private DirectoryService directoryService;

    private AuthService service;

    @BeforeEach
    void setUp() {
        service = new AuthService(
                userRepository,
                codeRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                otpService,
                challengeRepository,
                directoryService);
    }

    @Test
    void registersVerifiedUserAfterBothOtpChecksAndConsumesInvite() {
        RegisterRequest request = validRequest();
        VerificationCode invite = new VerificationCode();
        invite.setCode(request.inviteCode());

        when(otpService.normalizeDestination(OtpChannel.EMAIL, request.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber()))
                .thenReturn("+919876543210");
        when(codeRepository.findByCode(request.inviteCode())).thenReturn(Optional.of(invite));
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
        when(codeRepository.save(invite)).thenReturn(invite);

        var response = service.register(request);

        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.status()).isEqualTo(UserStatus.VERIFIED);
        assertThat(response.email()).isEqualTo("member@example.com");
        assertThat(response.phoneNumber()).isEqualTo("+919876543210");
        assertThat(response.inviteCodeUsed()).isEqualTo(request.inviteCode());
        assertThat(invite.isUsed()).isTrue();
        assertThat(invite.getUsedByUser().getId()).isEqualTo(42L);
        verify(otpService).consumeVerification(
                request.emailVerificationToken(), OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, "member@example.com");
        verify(otpService).consumeVerification(
                request.phoneVerificationToken(), OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, "+919876543210");
    }

    @Test
    void rejectsAlreadyUsedInviteBeforeCreatingUser() {
        RegisterRequest request = validRequest();
        VerificationCode invite = new VerificationCode();
        invite.setCode(request.inviteCode());
        invite.setUsed(true);

        when(otpService.normalizeDestination(OtpChannel.EMAIL, request.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber()))
                .thenReturn("+919876543210");
        when(codeRepository.findByCode(request.inviteCode())).thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(error.getReason()).isEqualTo("Verification code has already been used");
                });
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void acceptsRegistrationWithoutIdProofUrl() {
        RegisterRequest request = new RegisterRequest(
                "Test Member",
                "Member@Example.com",
                "+91 98765 43210",
                "Strong@123",
                "SC-ABC123",
                "",
                ProfessionalGroup.COMMUNITY,
                Set.of(1L),
                "email-token",
                "mobile-token");
        VerificationCode invite = new VerificationCode();
        invite.setCode(request.inviteCode());

        when(otpService.normalizeDestination(OtpChannel.EMAIL, request.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber()))
                .thenReturn("+919876543210");
        when(codeRepository.findByCode(request.inviteCode())).thenReturn(Optional.of(invite));
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(43L);
            return user;
        });

        var response = service.register(request);

        assertThat(response.idProofUrl()).isNull();
        assertThat(response.status()).isEqualTo(UserStatus.VERIFIED);
    }

    @Test
    void rejectsApprovedRequestCodeForDifferentVerifiedApplicant() {
        RegisterRequest request = validRequest();
        VerificationCode invite = new VerificationCode();
        invite.setId(99L);
        invite.setCode(request.inviteCode());
        OtpChallenge owner = new OtpChallenge();
        owner.setDestination("INVITE\nsomeone-else@example.com\n+919999999999\nSomeone Else");

        when(otpService.normalizeDestination(OtpChannel.EMAIL, request.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber()))
                .thenReturn("+919876543210");
        when(codeRepository.findByCode(request.inviteCode())).thenReturn(Optional.of(invite));
        when(challengeRepository.findTopByCodeHashAndPurposeAndDestinationStartingWithOrderByCreatedAtDesc(
                request.inviteCode(), OtpPurpose.PASSWORD_RESET, "INVITE\n")).thenReturn(Optional.of(owner));

        assertThatThrownBy(() -> service.register(request))
                .isInstanceOfSatisfying(ResponseStatusException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(error.getReason()).contains("different verified applicant");
                });
        verify(userRepository, never()).save(any(User.class));
    }

    private RegisterRequest validRequest() {
        return new RegisterRequest(
                "Test Member",
                "Member@Example.com",
                "+91 98765 43210",
                "Strong@123",
                "SC-ABC123",
                "https://drive.google.com/id-proof",
                ProfessionalGroup.COMMUNITY,
                Set.of(1L),
                "email-token",
                "mobile-token");
    }
}
