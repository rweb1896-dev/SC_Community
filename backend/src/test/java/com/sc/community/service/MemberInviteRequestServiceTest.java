package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sc.community.dto.MemberInviteRequestDtos.CreateMemberInviteRequest;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.User;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MemberInviteRequestServiceTest {
    @Mock private OtpChallengeRepository repository;
    @Mock private CurrentUserService currentUserService;
    @Mock private AdminService adminService;
    @Mock private UserRepository userRepository;
    private MemberInviteRequestService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new MemberInviteRequestService(repository, currentUserService, adminService, userRepository);
        user = new User(); user.setId(7L); user.setFullName("Registered Member"); user.setEmail("member@example.com");
    }

    @Test
    void registeredUserCreatesPendingInviteForRecipient() {
        when(currentUserService.verifiedUser()).thenReturn(user);
        when(repository.findByPurposeAndDestinationStartingWithOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());
        when(repository.save(any(OtpChallenge.class))).thenAnswer(invocation -> {
            OtpChallenge item = invocation.getArgument(0); item.setId(50L); item.setCreatedAt(Instant.now()); return item;
        });
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        var response = service.create(new CreateMemberInviteRequest("friend@example.com", ""));
        assertThat(response.status()).isEqualTo("PENDING");
        assertThat(response.recipientEmail()).isEqualTo("friend@example.com");
    }

    @Test
    void adminApprovalReturnsGeneratedSingleUseCode() {
        OtpChallenge item = pending();
        VerificationCode code = new VerificationCode(); code.setCode("SC-APPROVED1");
        when(repository.findById(50L)).thenReturn(Optional.of(item));
        when(adminService.createInviteCode()).thenReturn(code);
        when(repository.save(item)).thenReturn(item);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        var response = service.approve(50L);
        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.inviteCode()).isEqualTo("SC-APPROVED1");
    }

    private OtpChallenge pending() {
        OtpChallenge item = new OtpChallenge(); item.setId(50L);
        item.setDestination("MEMBER_INVITE\n7\nRegistered Member\nfriend@example.com\n");
        item.setPurpose(com.sc.community.entity.OtpPurpose.PASSWORD_RESET);
        item.setCodeHash("PENDING"); item.setCreatedAt(Instant.now()); return item;
    }
}
