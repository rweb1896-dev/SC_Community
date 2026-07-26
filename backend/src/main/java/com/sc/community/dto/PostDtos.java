package com.sc.community.dto;

import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public final class PostDtos {
    private PostDtos() {
    }

    public record CreatePostRequest(@NotNull Long categoryId, @NotBlank String content, String imageUrl) {
    }

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
            Instant createdAt
    ) {
        public static PostResponse from(Post post) {
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
                    post.getCreatedAt()
            );
        }
    }
}
