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
            @Size(max = 500) String address,
            String emailVerificationToken,
            String phoneVerificationToken) { }

    public record ProfileUpdateResponse(UserResponse user, String token) { }
}
