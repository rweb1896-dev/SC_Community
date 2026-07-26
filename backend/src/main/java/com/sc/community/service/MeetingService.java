package com.sc.community.service;

import com.sc.community.dto.MeetingDtos.MeetingResponse;
import com.sc.community.dto.MeetingDtos.RequestMeetingRequest;
import com.sc.community.entity.Meeting;
import com.sc.community.entity.MeetingAudience;
import com.sc.community.entity.MeetingParticipant;
import com.sc.community.entity.MeetingStatus;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.repository.MeetingParticipantRepository;
import com.sc.community.repository.MeetingRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MeetingService {
    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;
    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;

    public MeetingService(
            MeetingRepository meetingRepository,
            MeetingParticipantRepository participantRepository,
            CurrentUserService currentUserService,
            SimpMessagingTemplate messagingTemplate) {
        this.meetingRepository = meetingRepository;
        this.participantRepository = participantRepository;
        this.currentUserService = currentUserService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public MeetingResponse requestMeeting(RequestMeetingRequest request) {
        User requester = currentUserService.verifiedUser();
        Meeting meeting = new Meeting();
        meeting.setTitle(request.title().trim());
        meeting.setAgenda(cleanOptional(request.agenda()));
        meeting.setAudience(request.audience());
        meeting.setRequestedBy(requester);
        Meeting saved = meetingRepository.save(meeting);
        broadcast(saved);
        return response(saved, requester);
    }

    @Transactional
    public List<MeetingResponse> meetings() {
        User current = currentUserService.verifiedUser();
        return meetingRepository.findAllByOrderByRequestedAtDesc().stream()
                .filter(meeting -> isAdmin(current)
                        || meeting.getRequestedBy().getId().equals(current.getId())
                        || (meeting.getStatus() == MeetingStatus.LIVE && isEligible(meeting, current)))
                .map(meeting -> response(meeting, current))
                .toList();
    }

    @Transactional
    public MeetingResponse meeting(Long meetingId) {
        User current = currentUserService.verifiedUser();
        Meeting meeting = find(meetingId);
        boolean visible = isAdmin(current)
                || meeting.getRequestedBy().getId().equals(current.getId())
                || (meeting.getStatus() == MeetingStatus.LIVE && isEligible(meeting, current));
        if (!visible) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This meeting is not available to your group");
        }
        return response(meeting, current);
    }

    @Transactional
    public List<MeetingResponse> pendingMeetings() {
        User admin = requireAdmin();
        return meetingRepository.findByStatusOrderByRequestedAtDesc(MeetingStatus.PENDING_APPROVAL).stream()
                .map(meeting -> response(meeting, admin))
                .toList();
    }

    @Transactional
    public MeetingResponse approve(Long meetingId) {
        User admin = requireAdmin();
        Meeting meeting = find(meetingId);
        requirePending(meeting);
        Instant now = Instant.now();
        meeting.setStatus(MeetingStatus.LIVE);
        meeting.setApprovedBy(admin);
        meeting.setApprovedAt(now);
        meeting.setStartedAt(now);
        meeting.setRejectionReason(null);
        Meeting saved = meetingRepository.save(meeting);
        broadcast(saved);
        return response(saved, admin);
    }

    @Transactional
    public MeetingResponse reject(Long meetingId, String reason) {
        User admin = requireAdmin();
        Meeting meeting = find(meetingId);
        requirePending(meeting);
        meeting.setStatus(MeetingStatus.REJECTED);
        meeting.setApprovedBy(admin);
        meeting.setApprovedAt(Instant.now());
        meeting.setRejectionReason(cleanOptional(reason));
        Meeting saved = meetingRepository.save(meeting);
        broadcast(saved);
        return response(saved, admin);
    }

    @Transactional
    public MeetingResponse join(Long meetingId) {
        User current = currentUserService.verifiedUser();
        Meeting meeting = find(meetingId);
        assertCanJoin(meeting, current);

        MeetingParticipant participant = participantRepository
                .findByMeetingIdAndUserId(meetingId, current.getId())
                .orElseGet(MeetingParticipant::new);
        participant.setMeeting(meeting);
        participant.setUser(current);
        participant.setJoinedAt(Instant.now());
        participant.setLeftAt(null);
        participantRepository.save(participant);
        broadcast(meeting);
        return response(meeting, current);
    }

    @Transactional
    public void leave(Long meetingId) {
        User current = currentUserService.verifiedUser();
        participantRepository.findByMeetingIdAndUserId(meetingId, current.getId()).ifPresent(participant -> {
            participant.setLeftAt(Instant.now());
            participantRepository.save(participant);
        });
        meetingRepository.findById(meetingId).ifPresent(this::broadcast);
    }

    @Transactional
    public MeetingResponse end(Long meetingId) {
        User current = currentUserService.verifiedUser();
        Meeting meeting = find(meetingId);
        if (!isAdmin(current) && !meeting.getRequestedBy().getId().equals(current.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the host or an admin can end this meeting");
        }
        if (meeting.getStatus() != MeetingStatus.LIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Meeting is not live");
        }
        Instant now = Instant.now();
        meeting.setStatus(MeetingStatus.ENDED);
        meeting.setEndedAt(now);
        participantRepository.findByMeetingIdAndLeftAtIsNull(meetingId).forEach(participant -> {
            participant.setLeftAt(now);
            participantRepository.save(participant);
        });
        Meeting saved = meetingRepository.save(meeting);
        broadcast(saved);
        return response(saved, current);
    }

    @Transactional
    public User authorizeSignal(Long meetingId, User current) {
        Meeting meeting = find(meetingId);
        assertCanJoin(meeting, current);
        boolean joined = participantRepository
                .findByMeetingIdAndUserId(meetingId, current.getId())
                .filter(participant -> participant.getLeftAt() == null)
                .isPresent();
        if (!joined) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join the meeting before sending media");
        }
        return current;
    }

    private void assertCanJoin(Meeting meeting, User current) {
        if (meeting.getStatus() != MeetingStatus.LIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Meeting is not live");
        }
        if (!isEligible(meeting, current)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This meeting is limited to another professional group");
        }
    }

    private boolean isEligible(Meeting meeting, User user) {
        if (isAdmin(user) || meeting.getRequestedBy().getId().equals(user.getId())) {
            return true;
        }
        ProfessionalGroup group = user.getProfessionalGroup() == null
                ? ProfessionalGroup.COMMUNITY
                : user.getProfessionalGroup();
        return switch (meeting.getAudience()) {
            case ALL -> true;
            case DOCTORS -> group == ProfessionalGroup.DOCTOR;
            case ENGINEERS -> group == ProfessionalGroup.ENGINEER;
            case EDUCATION -> group == ProfessionalGroup.EDUCATION;
            case SOCIAL_WORKERS -> group == ProfessionalGroup.SOCIAL_WORKER;
        };
    }

    private MeetingResponse response(Meeting meeting, User current) {
        long participants = participantRepository.countByMeetingIdAndLeftAtIsNull(meeting.getId());
        boolean canJoin = meeting.getStatus() == MeetingStatus.LIVE && isEligible(meeting, current);
        boolean canManage = isAdmin(current) || meeting.getRequestedBy().getId().equals(current.getId());
        return MeetingResponse.from(meeting, participants, canJoin, canManage);
    }

    private User requireAdmin() {
        User current = currentUserService.verifiedUser();
        if (!isAdmin(current)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin permission is required");
        }
        return current;
    }

    private boolean isAdmin(User user) {
        return user.getRole() == UserRole.ROLE_ADMIN;
    }

    private Meeting find(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meeting not found"));
    }

    private void requirePending(Meeting meeting) {
        if (meeting.getStatus() != MeetingStatus.PENDING_APPROVAL) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Meeting request has already been reviewed");
        }
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void broadcast(Meeting meeting) {
        messagingTemplate.convertAndSend(
                "/topic/meetings/updates",
                Map.of("meetingId", meeting.getId(), "status", meeting.getStatus())
        );
    }
}
