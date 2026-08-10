package com.sc.community.repository;
import com.sc.community.entity.HelpMessage; import java.util.List; import org.springframework.data.jpa.repository.JpaRepository;
public interface HelpMessageRepository extends JpaRepository<HelpMessage,Long>{ List<HelpMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId); }
