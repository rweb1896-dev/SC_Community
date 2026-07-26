package com.sc.community.repository;

import com.sc.community.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @EntityGraph(attributePaths = {"post", "user"})
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
}
