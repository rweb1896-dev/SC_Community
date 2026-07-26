package com.sc.community.dto;

import com.sc.community.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public final class CommentDtos {
    private CommentDtos() {
    }

    public record CreateCommentRequest(@NotBlank String commentText) {
    }

    public record CommentResponse(Long id, Long postId, Long userId, String authorName, String commentText, Instant createdAt) {
        public static CommentResponse from(Comment comment) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getPost().getId(),
                    comment.getUser().getId(),
                    comment.getUser().getFullName(),
                    comment.getCommentText(),
                    comment.getCreatedAt()
            );
        }
    }
}
