package com.sc.community.repository;

import com.sc.community.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByPostIdAndReason(Long postId, String reason);
    boolean existsByPostIdAndReportedByUserIdAndReason(Long postId, Long userId, String reason);
    java.util.Optional<Report> findByPostIdAndReportedByUserIdAndReason(Long postId, Long userId, String reason);

    @Query("select r.post.id, count(r) from Report r where r.reason = :reason and r.post.id in :postIds group by r.post.id")
    java.util.List<Object[]> countGroupedByPostIdsAndReason(@Param("postIds") java.util.Collection<Long> postIds,
            @Param("reason") String reason);

    @Query("select r.post.id from Report r where r.reportedByUser.id = :userId and r.reason = :reason and r.post.id in :postIds")
    java.util.List<Long> supportedPostIds(@Param("postIds") java.util.Collection<Long> postIds,
            @Param("userId") Long userId, @Param("reason") String reason);
}
