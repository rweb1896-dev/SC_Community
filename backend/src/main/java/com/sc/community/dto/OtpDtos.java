package com.sc.community.dto;

import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class OtpDtos {
    private OtpDtos() {
    }

    public record OtpRequest(
            @NotNull OtpChannel channel,
            @NotNull OtpPurpose purpose,
            @NotBlank @Size(max = 320) String destination
    ) {
    }

    public record OtpRequestResponse(
            String message,
            Instant expiresAt,
            String developmentCode
    ) {
    }

    public record OtpVerifyRequest(
            @NotNull OtpChannel channel,
            @NotNull OtpPurpose purpose,
            @NotBlank @Size(max = 320) String destination,
            @NotBlank
            @Pattern(regexp = "^[A-Za-z0-9]{4,8}$", message = "OTP must contain 4 to 8 letters or numbers")
            String code
    ) {
    }

    public record OtpVerifyResponse(
            String verificationToken,
            Instant expiresAt
    ) {
    }

    public record PasswordResetRequest(
            @NotBlank String resetToken,
            @NotBlank
            @Size(min = 8, max = 72)
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                    message = "Password must include uppercase, lowercase, number, and special character")
            String newPassword
    ) {
    }

    public record MessageResponse(String message) {
    }
}
