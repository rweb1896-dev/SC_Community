package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import java.util.List;

public record AuthResponse(
        String token,
        Long userId,
        String fullName,
        String email,
        UserRole role,
        UserStatus status,
        ProfessionalGroup professionalGroup,
        List<Long> helpFieldIds,
        List<String> helpFieldNames,
        boolean profileComplete
) {
}
