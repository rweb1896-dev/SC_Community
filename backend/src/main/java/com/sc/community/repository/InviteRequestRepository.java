package com.sc.community.repository;

import com.sc.community.entity.InviteRequest;
import com.sc.community.entity.InviteRequestStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InviteRequestRepository extends JpaRepository<InviteRequest, Long> {
    Optional<InviteRequest> findByRequestToken(String requestToken);
    Optional<InviteRequest> findByVerificationCodeId(Long verificationCodeId);

    List<InviteRequest> findByStatusOrderByRequestedAtAsc(InviteRequestStatus status);

    @Query("""
            select request from InviteRequest request
            where request.status = :status
              and (request.email = :email or request.phoneNumber = :phoneNumber)
            order by request.requestedAt desc
            """)
    List<InviteRequest> findMatching(
            @Param("status") InviteRequestStatus status,
            @Param("email") String email,
            @Param("phoneNumber") String phoneNumber);
}
