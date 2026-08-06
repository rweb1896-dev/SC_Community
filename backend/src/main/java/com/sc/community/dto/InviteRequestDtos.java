package com.sc.community.dto;

import com.sc.community.entity.InviteRequest;
import com.sc.community.entity.InviteRequestStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class InviteRequestDtos {
    private InviteRequestDtos() {
    }

    public record CreateInviteRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$") String phoneNumber,
            @NotBlank String emailVerificationToken,
            @NotBlank String phoneVerificationToken
    ) {
    }

    public record InviteRequestResponse(
            Long id,
            String requestToken,
            String fullName,
            String email,
            String phoneNumber,
            InviteRequestStatus status,
            String inviteCode,
            Instant requestedAt,
            Instant approvedAt
    ) {
        public static InviteRequestResponse from(InviteRequest request) {
            return new InviteRequestResponse(
                    request.getId(),
                    request.getRequestToken(),
                    request.getFullName(),
                    request.getEmail(),
                    request.getPhoneNumber(),
                    request.getStatus(),
                    request.getVerificationCode() == null ? null : request.getVerificationCode().getCode(),
                    request.getRequestedAt(),
                    request.getApprovedAt());
        }
    }
}
