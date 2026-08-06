package com.sc.community.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class MemberInviteRequestDtos {
    private MemberInviteRequestDtos() {}

    public record CreateMemberInviteRequest(
            @Email @Size(max = 160) String recipientEmail,
            @Pattern(regexp = "^$|^\\+?[1-9]\\d{9,14}$") String recipientMobile) {}

    public record RejectMemberInviteRequest(@Size(max = 80) String reason) {}

    public record MemberInviteRequestResponse(
            Long id, String requesterName, String requesterEmail, String recipientEmail,
            String recipientMobile, String status, String inviteCode, String rejectionReason,
            Instant requestedAt, Instant decidedAt) {}
}
