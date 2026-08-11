package com.sc.community.repository;

import com.sc.community.entity.*;
import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface HelpVolunteerRequestRepository extends JpaRepository<HelpVolunteerRequest,Long> {
    Optional<HelpVolunteerRequest> findByPostIdAndVolunteerIdAndStatus(Long postId,Long volunteerId,VolunteerRequestStatus status);
    List<HelpVolunteerRequest> findByRequestedToIdAndStatusOrderByCreatedAtDesc(Long userId,VolunteerRequestStatus status);
    List<HelpVolunteerRequest> findByPostIdAndStatus(Long postId,VolunteerRequestStatus status);
    long countByPostIdAndStatus(Long postId,VolunteerRequestStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths={"post","post.category","post.user","volunteer","requestedTo","conversation"})
    @Query("select r from HelpVolunteerRequest r where r.id=:id")
    Optional<HelpVolunteerRequest> findLockedById(@Param("id") Long id);
}
