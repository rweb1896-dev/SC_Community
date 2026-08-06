package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sc.community.dto.InviteRequestDtos.CreateInviteRequest;
import com.sc.community.entity.InviteRequest;
import com.sc.community.entity.InviteRequestStatus;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.User;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.InviteRequestRepository;
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
    @Mock private InviteRequestRepository requestRepository;
    @Mock private OtpService otpService;
    @Mock private AdminService adminService;
    @Mock private CurrentUserService currentUserService;

    private InviteRequestService service;

    @BeforeEach
    void setUp() {
        service = new InviteRequestService(requestRepository, otpService, adminService, currentUserService);
    }

    @Test
    void createsPendingRequestOnlyAfterBothIdentityVerifications() {
        CreateInviteRequest input = request();
        when(otpService.normalizeDestination(OtpChannel.EMAIL, input.email()))
                .thenReturn("member@example.com");
        when(otpService.normalizeDestination(OtpChannel.MOBILE, input.phoneNumber()))
                .thenReturn("+919876543210");
        when(requestRepository.findMatching(
                InviteRequestStatus.PENDING, "member@example.com", "+919876543210"))
                .thenReturn(List.of());
        when(requestRepository.save(any(InviteRequest.class))).thenAnswer(invocation -> {
            InviteRequest request = invocation.getArgument(0);
            request.setId(12L);
            request.setRequestedAt(Instant.now());
            return request;
        });

        var response = service.create(input);

        assertThat(response.status()).isEqualTo(InviteRequestStatus.PENDING);
        assertThat(response.requestToken()).hasSize(32);
        verify(otpService).validateVerification(
                "email-token", OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, "member@example.com");
        verify(otpService).validateVerification(
                "mobile-token", OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, "+919876543210");
    }

    @Test
    void approvalGeneratesSingleUseCodeAndLinksItToRequest() {
        InviteRequest request = pendingRequest();
        VerificationCode code = new VerificationCode();
        code.setId(8L);
        code.setCode("SC-SECURE123");
        User admin = new User();
        admin.setId(1L);

        when(requestRepository.findById(12L)).thenReturn(Optional.of(request));
        when(adminService.createInviteCode()).thenReturn(code);
        when(currentUserService.currentUser()).thenReturn(admin);
        when(requestRepository.save(request)).thenReturn(request);

        var response = service.approve(12L);

        assertThat(response.status()).isEqualTo(InviteRequestStatus.APPROVED);
        assertThat(response.inviteCode()).isEqualTo("SC-SECURE123");
        assertThat(request.getVerificationCode()).isSameAs(code);
        assertThat(request.getReviewedByAdmin()).isSameAs(admin);
        assertThat(request.getApprovedAt()).isNotNull();
    }

    private CreateInviteRequest request() {
        return new CreateInviteRequest(
                "Test Member",
                "Member@Example.com",
                "+91 98765 43210",
                "email-token",
                "mobile-token");
    }

    private InviteRequest pendingRequest() {
        InviteRequest request = new InviteRequest();
        request.setId(12L);
        request.setRequestToken("abc123");
        request.setFullName("Test Member");
        request.setEmail("member@example.com");
        request.setPhoneNumber("+919876543210");
        request.setRequestedAt(Instant.now());
        return request;
    }
}
