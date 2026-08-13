package com.sc.community.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class ProfileDtos {
    private ProfileDtos() { }

    public record UpdateProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Pattern(regexp = "^\\+?[1-9]\\d{9,14}$", message = "Enter a valid mobile number") String phoneNumber,
            @Size(max = 240) String address,
            @Size(max = 1000) @Pattern(regexp = "^$|^https?://.+$|^/api/public/gallery/\\d+/image$", message = "Photo must be an uploaded image or http(s) URL") String photoUrl,
            @Size(max = 80) String currentPost,
            @Size(max = 100) String position,
            @Size(max = 120) String school,
            @Size(max = 120) String college,
            @Size(max = 260) String bestAchievement,
            @Size(max = 40) String profileCategory,
            @Size(max = 40) String workStatus,
            @Size(max = 40) String employmentType,
            @Pattern(regexp = "^$|^\\d{4}-\\d{2}-\\d{2}$", message = "Enter date of birth as YYYY-MM-DD") String dateOfBirth,
            boolean lookingForJob,
            String emailVerificationToken,
            String phoneVerificationToken) { }

    public record ProfileUpdateResponse(ProfileResponse user, String token) { }
}
