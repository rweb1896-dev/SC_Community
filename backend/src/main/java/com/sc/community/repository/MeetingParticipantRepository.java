package com.sc.community.repository;

import com.sc.community.entity.MeetingParticipant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, Long> {
    Optional<MeetingParticipant> findByMeetingIdAndUserId(Long meetingId, Long userId);
    long countByMeetingIdAndLeftAtIsNull(Long meetingId);
    List<MeetingParticipant> findByMeetingIdAndLeftAtIsNull(Long meetingId);
}
