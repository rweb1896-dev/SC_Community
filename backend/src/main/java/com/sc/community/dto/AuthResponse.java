package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email,
        UserRole role,
        UserStatus status,
        ProfessionalGroup professionalGroup
) {
}
