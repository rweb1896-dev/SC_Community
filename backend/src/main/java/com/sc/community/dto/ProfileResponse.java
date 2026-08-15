package com.sc.community.dto;

import com.sc.community.entity.User;

/** Self-profile response. Date of birth is deliberately absent from public member data. */
public record ProfileResponse(UserResponse user, String dateOfBirth, boolean profilePublic) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(UserResponse.from(user), user.getDateOfBirth(), user.isProfilePublic());
    }
}
