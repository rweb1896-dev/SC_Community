package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 100) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank
        @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Enter a valid mobile number")
        String phoneNumber,
        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
                message = "Password must include uppercase, lowercase, number, and special character")
        String password,
        @NotBlank @Size(max = 64) String inviteCode,
        @NotBlank
        @Pattern(regexp = "^https?://.+$", message = "ID proof must be a valid http(s) URL")
        @Size(max = 1000)
        String idProofUrl,
        @NotNull ProfessionalGroup professionalGroup,
        @NotBlank String emailVerificationToken,
        @NotBlank String phoneVerificationToken
) {
}
