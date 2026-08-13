package com.sc.community.dto;

import com.sc.community.entity.User;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String address,
        String photoUrl,
        String currentPost,
        String position,
        String school,
        String college,
        String bestAchievement,
        int profileCompletion,
        UserRole role,
        UserStatus status,
        ProfessionalGroup professionalGroup,
        List<Long> helpFieldIds,
        List<String> helpFieldNames,
        boolean profileComplete,
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
                user.getAddress(),
                user.getPhotoUrl(),
                user.getCurrentPost(),
                user.getPosition(),
                user.getSchool(),
                user.getCollege(),
                user.getBestAchievement(),
                user.getProfileCompletion(),
                user.getRole(),
                user.getStatus(),
                user.getProfessionalGroup() == null ? ProfessionalGroup.COMMUNITY : user.getProfessionalGroup(),
                user.getHelpFields().stream().sorted(Comparator.comparingInt(field -> field.getDisplayOrder()))
                        .map(field -> field.getId()).toList(),
                user.getHelpFields().stream().sorted(Comparator.comparingInt(field -> field.getDisplayOrder()))
                        .map(field -> field.getName()).toList(),
                user.isProfileComplete(),
                user.getIdProofUrl(),
                user.getInviteCodeUsed(),
                user.getCreatedAt()
        );
    }
}
