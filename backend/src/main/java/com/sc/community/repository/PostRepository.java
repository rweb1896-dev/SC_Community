package com.sc.community.repository;

import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {
    @EntityGraph(attributePaths = {"user", "category"})
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @EntityGraph(attributePaths = {"user", "category"})
    List<Post> findByCategoryIdAndStatusOrderByCreatedAtDesc(Long categoryId, PostStatus status);
}
