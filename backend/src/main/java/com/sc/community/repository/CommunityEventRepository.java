package com.sc.community.repository;

import com.sc.community.entity.CommunityEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityEventRepository extends JpaRepository<CommunityEvent, Long> {
    List<CommunityEvent> findAllByOrderByEventAtAsc();
}
