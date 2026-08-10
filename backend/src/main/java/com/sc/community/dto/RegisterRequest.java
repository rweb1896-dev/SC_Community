package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Set;

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
        @Pattern(regexp = "^$|^https?://.+$", message = "ID proof must be a valid http(s) URL")
        @Size(max = 1000)
        String idProofUrl,
        @NotNull ProfessionalGroup professionalGroup,
        @NotEmpty(message = "Select at least one field where you can help")
        @Size(max = 8, message = "Select no more than 8 fields")
        Set<@NotNull Long> helpFieldIds,
        @NotBlank String emailVerificationToken,
        @NotBlank String phoneVerificationToken
) {
}
