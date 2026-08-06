package com.sc.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ManagedContentDtos {
    private ManagedContentDtos() {}

    public record SaveManagedContentRequest(
            @NotBlank @Pattern(regexp = "LEADER|BOOK") String type,
            @NotBlank @Size(max = 80) @Pattern(regexp = "[a-z0-9][a-z0-9-]*") String key,
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 120) String byline,
            @NotBlank @Size(max = 360) String summary,
            @NotBlank @Size(max = 40) String category,
            @Size(max = 160) String source,
            @Size(max = 1200) String url,
            @NotBlank @Size(max = 1200) String imageUrl,
            @Size(max = 360) String details) {}

    public record ManagedContentStatusRequest(
            @NotBlank @Pattern(regexp = "ACTIVE|BLOCKED|REMOVED") String status) {}

    public record ManagedContentResponse(
            Long recordId, String type, String key, String status, String title, String byline,
            String summary, String category, String source, String url, String imageUrl, String details,
            Instant updatedAt) {}
}
