package com.sc.community.repository;
import com.sc.community.entity.HelpAuditEvent; import java.util.Optional; import org.springframework.data.jpa.repository.JpaRepository;
public interface HelpAuditEventRepository extends JpaRepository<HelpAuditEvent,Long>{ Optional<HelpAuditEvent> findFirstByPostIdAndEventTypeOrderByCreatedAtDesc(Long postId,String eventType); }
