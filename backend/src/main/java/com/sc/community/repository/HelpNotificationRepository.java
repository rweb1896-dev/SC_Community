package com.sc.community.repository;
import com.sc.community.entity.HelpNotification; import java.util.List; import org.springframework.data.jpa.repository.JpaRepository;
public interface HelpNotificationRepository extends JpaRepository<HelpNotification,Long>{ List<HelpNotification> findByRecipientIdOrderByCreatedAtDesc(Long userId); boolean existsByDedupeKey(String key); long countByRecipientIdAndReadFalse(Long userId); }
