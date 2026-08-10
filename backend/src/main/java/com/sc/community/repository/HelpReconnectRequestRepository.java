package com.sc.community.repository;
import com.sc.community.entity.*; import jakarta.persistence.LockModeType; import java.util.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface HelpReconnectRequestRepository extends JpaRepository<HelpReconnectRequest,Long>{
 Optional<HelpReconnectRequest> findByConversationIdAndStatus(Long conversationId,ReconnectRequestStatus status);
 @EntityGraph(attributePaths={"conversation","conversation.post","conversation.post.category","requestedBy","requestedTo"}) List<HelpReconnectRequest> findByRequestedToIdAndStatusOrderByCreatedAtDesc(Long userId,ReconnectRequestStatus status);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @EntityGraph(attributePaths={"conversation","conversation.post","conversation.post.category","conversation.requester","conversation.helper","requestedBy","requestedTo"}) @Query("select r from HelpReconnectRequest r where r.id=:id") Optional<HelpReconnectRequest> findLockedById(@Param("id") Long id);
 List<HelpReconnectRequest> findByConversationPostIdAndStatus(Long postId,ReconnectRequestStatus status);
 Optional<HelpReconnectRequest> findFirstByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
