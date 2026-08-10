package com.sc.community.repository;

import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    @EntityGraph(attributePaths = {"user", "category"})
    List<Post> findByStatusOrderByCreatedAtDesc(PostStatus status);

    @EntityGraph(attributePaths = {"user", "category"})
    List<Post> findByCategoryIdAndStatusOrderByCreatedAtDesc(Long categoryId, PostStatus status);

    @EntityGraph(attributePaths = {"user", "category"})
    List<Post> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PostStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p join fetch p.user join fetch p.category where p.id = :id")
    Optional<Post> findLockedById(Long id);
}
