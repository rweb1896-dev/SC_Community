package com.sc.community.repository;

import com.sc.community.entity.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @EntityGraph(attributePaths = {"post", "user"})
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);

    @Query("select c.post.id, count(c) from Comment c where c.post.id in :postIds group by c.post.id")
    java.util.List<Object[]> countGroupedByPostIds(@Param("postIds") java.util.Collection<Long> postIds);
}
