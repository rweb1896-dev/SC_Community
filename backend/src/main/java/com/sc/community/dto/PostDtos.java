package com.sc.community.dto;

import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class PostDtos {
    private PostDtos() {
    }

    public record CreatePostRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 3000) String content,
            @Size(max = 1200)
            @Pattern(regexp = "^$|^https?://.+$|^/api/public/gallery/\\d+/image$", message = "Image must be a valid uploaded image or http(s) URL")
            String imageUrl) {
    }

    public record UpdatePostRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 3000) String content,
            @Size(max = 1200)
            @Pattern(regexp = "^$|^https?://.+$|^/api/public/gallery/\\d+/image$", message = "Image must be a valid uploaded image or http(s) URL")
            String imageUrl) { }

    public record PostResponse(
            Long id,
            Long userId,
            String authorName,
            boolean verifiedAuthor,
            Long categoryId,
            String categoryName,
            String content,
            String imageUrl,
            PostStatus status,
            Instant createdAt,
            Instant updatedAt,
            long supportCount,
            long commentCount,
            boolean supportedByCurrentUser
    ) {
        public static PostResponse from(Post post, long supportCount, long commentCount, boolean supportedByCurrentUser) {
            return new PostResponse(
                    post.getId(),
                    post.getUser().getId(),
                    post.getUser().getFullName(),
                    post.getUser().getStatus().name().equals("VERIFIED"),
                    post.getCategory().getId(),
                    post.getCategory().getName(),
                    post.getContent(),
                    post.getImageUrl(),
                    post.getStatus(),
                    post.getCreatedAt(),
                    post.getCreatedAt(),
                    supportCount,
                    commentCount,
                    supportedByCurrentUser
            );
        }
    }

    public record SupportResponse(Long postId, long supportCount, boolean supported) {}

    public record FeedEvent(String type, Long postId) {}
}
