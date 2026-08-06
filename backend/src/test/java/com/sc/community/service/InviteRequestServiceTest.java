package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.dto.InviteRequestDtos.CreateInviteRequest;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.OtpChallengeRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InviteRequestServiceTest {
    @Mock private OtpChallengeRepository challengeRepository;
    @Mock private OtpService otpService;
    @Mock private AdminService adminService;

    private InviteRequestService service;

    @BeforeEach
    void setUp() {
        service = new InviteRequestService(challengeRepository, otpService, adminService);
    }

    @Test
    void createsPersistentPendingRequestOnlyAfterBothIdentityVerifications() {
        CreateInviteRequest input = request();
        when(otpService.normalizeDestination(OtpChannel.EMAIL, input.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, input.phoneNumber()))
                .thenReturn("+919876543210");
        when(challengeRepository.findByPurposeAndDestinationStartingWithAndVerifiedAtIsNullAndUsedAtIsNullOrderByCreatedAtAsc(
                OtpPurpose.PASSWORD_RESET, "INVITE\n")).thenReturn(List.of());
        when(challengeRepository.save(any(OtpChallenge.class))).thenAnswer(invocation -> {
            OtpChallenge challenge = invocation.getArgument(0);
            challenge.setId(12L);
            challenge.setCreatedAt(Instant.now());
            return challenge;
        });

        var response = service.create(input);

        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.requestToken()).hasSize(32);
        assertThat(response.fullName()).isEqualTo("Test Member");
        verify(otpService).validateVerification(
                "email-token", OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, "member@example.com");
        verify(otpService).validateVerification(
                "mobile-token", OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, "+919876543210");
    }

    @Test
    void approvalGeneratesSingleUseCodeOnExistingChallenge() {
        OtpChallenge request = pendingRequest();
        VerificationCode code = new VerificationCode();
        code.setId(8L);
        code.setCode("SC-SECURE123");

        when(challengeRepository.findById(12L)).thenReturn(Optional.of(request));
        when(adminService.createInviteCode()).thenReturn(code);
        when(challengeRepository.save(request)).thenReturn(request);

        var response = service.approve(12L);

        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.inviteCode()).isEqualTo("SC-SECURE123");
        assertThat(request.getCodeHash()).isEqualTo("SC-SECURE123");
        assertThat(request.getVerifiedAt()).isNotNull();
    }

    private CreateInviteRequest request() {
        return new CreateInviteRequest(
                "Test Member",
                "Member@Example.com",
                "+91 98765 43210",
                "email-token",
                "mobile-token");
    }

    private OtpChallenge pendingRequest() {
        OtpChallenge request = new OtpChallenge();
        request.setId(12L);
        request.setVerificationToken("abc123");
        request.setDestination("INVITE\nmember@example.com\n+919876543210\nTest Member");
        request.setChannel(OtpChannel.EMAIL);
        request.setPurpose(OtpPurpose.PASSWORD_RESET);
        request.setCodeHash("PENDING");
        request.setCreatedAt(Instant.now());
        request.setExpiresAt(Instant.now().plusSeconds(3600));
        return request;
    }
}
