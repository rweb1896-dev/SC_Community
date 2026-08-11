package com.sc.community.repository;
import com.sc.community.entity.*; import jakarta.persistence.LockModeType; import java.util.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface HelpNotificationRepository extends JpaRepository<HelpNotification,Long>{
 List<HelpNotification> findByRecipientIdOrderByCreatedAtDesc(Long userId); boolean existsByDedupeKey(String key); long countByRecipientIdAndReadFalse(Long userId);
 Optional<HelpNotification> findByDedupeKey(String key);
 List<HelpNotification> findByRecipientIdAndTypeAndReadFalseOrderByCreatedAtDesc(Long userId,HelpNotificationType type);
 List<HelpNotification> findByPostIdAndTypeAndReadFalse(Long postId,HelpNotificationType type);
 long countByPostIdAndTypeAndReadFalse(Long postId,HelpNotificationType type);
 @Lock(LockModeType.PESSIMISTIC_WRITE) @EntityGraph(attributePaths={"recipient","post","post.category","post.user","conversation"}) @Query("select n from HelpNotification n where n.id=:id") Optional<HelpNotification> findLockedById(@Param("id") Long id);
}
