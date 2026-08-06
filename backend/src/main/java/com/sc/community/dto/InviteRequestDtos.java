package com.sc.community.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class InviteRequestDtos {
    private InviteRequestDtos() {
    }

    public record CreateInviteRequest(
            @NotBlank @Size(min = 2, max = 80) String fullName,
            @NotBlank @Email @Size(max = 200) String email,
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
            String status,
            String inviteCode,
            Instant requestedAt,
            Instant approvedAt
    ) {
    }
}
