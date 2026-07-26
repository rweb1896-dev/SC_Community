package com.sc.community.dto;

import com.sc.community.entity.User;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import java.time.Instant;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        UserRole role,
        UserStatus status,
        ProfessionalGroup professionalGroup,
        String idProofUrl,
        String inviteCodeUsed,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole(),
                user.getStatus(),
                user.getProfessionalGroup() == null ? ProfessionalGroup.COMMUNITY : user.getProfessionalGroup(),
                user.getIdProofUrl(),
                user.getInviteCodeUsed(),
                user.getCreatedAt()
        );
    }
}
