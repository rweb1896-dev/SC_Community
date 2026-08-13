package com.sc.community.dto;

import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;

/** Admin-only member intelligence record. DOB never leaves the admin or self-profile API. */
public record AdminUserResponse(
        Long id, String fullName, String email, String phoneNumber, String address, String photoUrl,
        String currentPost, String position, String school, String college, String bestAchievement,
        String profileCategory, String workStatus, String employmentType, boolean lookingForJob,
        String dateOfBirth, String ageGroup, int profileCompletion, UserRole role, UserStatus status,
        ProfessionalGroup professionalGroup, List<Long> helpFieldIds, List<String> helpFieldNames,
        boolean profileComplete, String idProofUrl, String inviteCodeUsed, Instant createdAt) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhoneNumber(),
                user.getAddress(), user.getPhotoUrl(), user.getCurrentPost(), user.getPosition(), user.getSchool(),
                user.getCollege(), user.getBestAchievement(), user.getProfileCategory(), user.getWorkStatus(),
                user.getEmploymentType(), user.isLookingForJob(), user.getDateOfBirth(), ageGroup(user.getDateOfBirth()),
                user.getProfileCompletion(), user.getRole(), user.getStatus(),
                user.getProfessionalGroup() == null ? ProfessionalGroup.COMMUNITY : user.getProfessionalGroup(),
                user.getHelpFields().stream().sorted(Comparator.comparingInt(field -> field.getDisplayOrder())).map(field -> field.getId()).toList(),
                user.getHelpFields().stream().sorted(Comparator.comparingInt(field -> field.getDisplayOrder())).map(field -> field.getName()).toList(),
                user.isProfileComplete(), user.getIdProofUrl(), user.getInviteCodeUsed(), user.getCreatedAt());
    }
    private static String ageGroup(String value) {
        if (value == null || value.isBlank()) return "NOT_ADDED";
        try {
            int age = Period.between(LocalDate.parse(value), LocalDate.now()).getYears();
            if (age < 18) return "UNDER_18";
            if (age <= 24) return "18_24";
            if (age <= 34) return "25_34";
            if (age <= 44) return "35_44";
            if (age <= 59) return "45_59";
            return "60_PLUS";
        } catch (RuntimeException ignored) { return "NOT_ADDED"; }
    }
}
