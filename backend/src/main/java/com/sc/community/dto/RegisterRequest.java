package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank String fullName,
        @Email String email,
        String phoneNumber,
        @NotBlank String password,
        @NotBlank String inviteCode,
        String idProofUrl,
        ProfessionalGroup professionalGroup
) {
}
