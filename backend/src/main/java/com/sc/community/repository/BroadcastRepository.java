package com.sc.community.repository;

import com.sc.community.entity.Broadcast;
import com.sc.community.entity.BroadcastStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BroadcastRepository extends JpaRepository<Broadcast, Long> {
    List<Broadcast> findAllByOrderByCreatedAtDesc();
    List<Broadcast> findByStatus(BroadcastStatus status);
    Optional<Broadcast> findTopByTitleOrderByCreatedAtDesc(String title);
}
