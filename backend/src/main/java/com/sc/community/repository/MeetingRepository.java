package com.sc.community.repository;

import com.sc.community.entity.Meeting;
import com.sc.community.entity.MeetingStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    @EntityGraph(attributePaths = {"requestedBy", "approvedBy"})
    List<Meeting> findAllByOrderByRequestedAtDesc();

    @EntityGraph(attributePaths = {"requestedBy", "approvedBy"})
    List<Meeting> findByStatusOrderByRequestedAtDesc(MeetingStatus status);

    @Override
    @EntityGraph(attributePaths = {"requestedBy", "approvedBy"})
    Optional<Meeting> findById(Long id);
}
