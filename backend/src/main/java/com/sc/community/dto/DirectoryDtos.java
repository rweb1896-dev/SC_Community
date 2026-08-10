package com.sc.community.dto;

import com.sc.community.entity.Achiever;
import com.sc.community.entity.ExpertiseField;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Set;

public final class DirectoryDtos {
    private DirectoryDtos() {}

    public record ExpertiseFieldResponse(Long id, String name, String description, String iconKey,
            boolean active, int displayOrder) {
        public static ExpertiseFieldResponse from(ExpertiseField field) {
            return new ExpertiseFieldResponse(field.getId(), field.getName(), field.getDescription(),
                    field.getIconKey(), field.isActive(), field.getDisplayOrder());
        }
    }

    public record CreateExpertiseFieldRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 280) String description,
            @NotBlank @Size(max = 40) String iconKey,
            @Min(0) @Max(999) int displayOrder) {}

    public record UpdateActiveRequest(boolean active) {}

    public record CreateAchieverRequest(
            @NotNull Long expertiseFieldId,
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 500) String achievement,
            @NotBlank @Size(max = 1500) String biography,
            @Pattern(regexp = "^$|^https?://.+$", message = "Image must be a valid http(s) URL") @Size(max = 1000) String imageUrl,
            @Pattern(regexp = "^$|^https?://.+$", message = "Profile must be a valid http(s) URL") @Size(max = 1000) String profileUrl,
            @Min(0) @Max(999) int displayOrder) {}

    public record AchieverResponse(Long id, Long expertiseFieldId, String expertiseFieldName,
            String fullName, String title, String achievement, String biography, String imageUrl,
            String profileUrl, boolean active, int displayOrder, Instant updatedAt) {
        public static AchieverResponse from(Achiever achiever) {
            return new AchieverResponse(achiever.getId(), achiever.getExpertiseField().getId(),
                    achiever.getExpertiseField().getName(), achiever.getFullName(), achiever.getTitle(),
                    achiever.getAchievement(), achiever.getBiography(), achiever.getImageUrl(),
                    achiever.getProfileUrl(), achiever.isActive(), achiever.getDisplayOrder(), achiever.getUpdatedAt());
        }
    }

    public record UpdateHelpFieldsRequest(
            @NotEmpty(message = "Select at least one field where you can help")
            @Size(max = 8, message = "Select no more than 8 fields") Set<@NotNull Long> fieldIds) {}
}
