package com.sc.community.dto;

import com.sc.community.entity.User;
import java.util.Comparator;
import java.util.List;

/** Safe opt-in profile view. Contact information and date of birth are never included. */
public record PublicMemberProfileResponse(
        Long id, String fullName, String photoUrl, String currentPost, String position, String school,
        String college, String bestAchievement, String profileCategory, String workStatus,
        String employmentType, boolean lookingForJob, List<String> helpFieldNames, int profileCompletion) {
    public static PublicMemberProfileResponse from(User user) {
        return new PublicMemberProfileResponse(user.getId(), user.getFullName(), user.getPhotoUrl(),
                user.getCurrentPost(), user.getPosition(), user.getSchool(), user.getCollege(),
                user.getBestAchievement(), user.getProfileCategory(), user.getWorkStatus(), user.getEmploymentType(),
                user.isLookingForJob(), user.getHelpFields().stream().sorted(Comparator.comparingInt(field -> field.getDisplayOrder()))
                        .map(field -> field.getName()).toList(), user.getProfileCompletion());
    }
}
