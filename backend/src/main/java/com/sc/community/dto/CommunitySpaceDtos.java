package com.sc.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class CommunitySpaceDtos {
    private CommunitySpaceDtos() { }

    public record SaveBlogRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 6000) String body,
            @Size(max = 1200)
            @Pattern(regexp = "^$|^https?://.+$|^/api/public/gallery/\\d+/image$", message = "Image must be a valid uploaded image or http(s) URL")
            String imageUrl) { }

    public record BlogResponse(Long id, boolean mine, String authorLabel, String title, String body,
            String imageUrl, Instant createdAt, Instant updatedAt) { }

    public record SaveDebateRequest(
            @NotBlank @Size(max = 180) String title,
            @NotBlank @Size(max = 2600) String body,
            @Size(max = 1200)
            @Pattern(regexp = "^$|^https?://.+$|^/api/public/gallery/\\d+/image$", message = "Image must be a valid uploaded image or http(s) URL")
            String imageUrl) { }

    public record DebateResponse(Long id, boolean mine, Long authorId, String authorLabel, String title,
            String body, String imageUrl, Instant createdAt, long commentCount) { }

    /** Deliberately never includes a name, photo or profile URL. */
    public record DebateCommentResponse(Long id, Long postId, Long userId, String authorLabel,
            String message, Instant createdAt) { }
}
