package com.sc.community.repository;
import com.sc.community.entity.*; import jakarta.persistence.LockModeType; import java.util.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface HelpConversationRepository extends JpaRepository<HelpConversation,Long>{
 @EntityGraph(attributePaths={"post","post.category","post.user","requester","helper","endedBy"})
 @Query("select c from HelpConversation c where (c.requester.id=:userId or c.helper.id=:userId) and c.status=:status order by coalesce(c.lastMessageAt,c.activatedAt) desc") List<HelpConversation> forUserByStatus(@Param("userId") Long userId,@Param("status") HelpConversationStatus status);
 @EntityGraph(attributePaths={"post","post.category","post.user","requester","helper","endedBy"})
 @Query("select c from HelpConversation c where (c.requester.id=:userId or c.helper.id=:userId) and c.status<>com.sc.community.entity.HelpConversationStatus.ACTIVE order by c.endedAt desc") List<HelpConversation> history(@Param("userId") Long userId);
 Optional<HelpConversation> findByPostIdAndHelperId(Long postId,Long helperId);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @EntityGraph(attributePaths={"post","post.category","post.user","requester","helper","endedBy"}) @Query("select c from HelpConversation c where c.id=:id") Optional<HelpConversation> findLockedById(@Param("id") Long id);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select c from HelpConversation c where c.post.id=:postId and c.status=:status") List<HelpConversation> lockByPostAndStatus(@Param("postId") Long postId,@Param("status") HelpConversationStatus status);
 long countByPostId(Long postId); long countByPostIdAndStatus(Long postId,HelpConversationStatus status);
 @Query("select c from HelpConversation c where (c.requester.id=:a and c.helper.id=:b) or (c.requester.id=:b and c.helper.id=:a)") List<HelpConversation> between(@Param("a") Long a,@Param("b") Long b);
}
