package com.sc.community.dto;

import com.sc.community.entity.Meeting;
import com.sc.community.entity.MeetingAudience;
import com.sc.community.entity.MeetingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class MeetingDtos {
    private MeetingDtos() {
    }

    public record RequestMeetingRequest(
            @NotBlank @Size(max = 140) String title,
            @Size(max = 800) String agenda,
            @NotNull MeetingAudience audience
    ) {
    }

    public record RejectMeetingRequest(@Size(max = 400) String reason) {
    }

    public record MeetingResponse(
            Long id,
            String title,
            String agenda,
            MeetingAudience audience,
            MeetingStatus status,
            Long hostId,
            String hostName,
            String approvedByName,
            String rejectionReason,
            Instant requestedAt,
            Instant approvedAt,
            Instant startedAt,
            Instant endedAt,
            long participantCount,
            boolean canJoin,
            boolean canManage
    ) {
        public static MeetingResponse from(
                Meeting meeting,
                long participantCount,
                boolean canJoin,
                boolean canManage) {
            return new MeetingResponse(
                    meeting.getId(),
                    meeting.getTitle(),
                    meeting.getAgenda(),
                    meeting.getAudience(),
                    meeting.getStatus(),
                    meeting.getRequestedBy().getId(),
                    meeting.getRequestedBy().getFullName(),
                    meeting.getApprovedBy() == null ? null : meeting.getApprovedBy().getFullName(),
                    meeting.getRejectionReason(),
                    meeting.getRequestedAt(),
                    meeting.getApprovedAt(),
                    meeting.getStartedAt(),
                    meeting.getEndedAt(),
                    participantCount,
                    canJoin,
                    canManage
            );
        }
    }

    public record MeetingSignalRequest(
            @NotBlank String type,
            Long targetUserId,
            String sdp,
            String candidate,
            String sdpMid,
            Integer sdpMLineIndex
    ) {
    }

    public record MeetingSignalResponse(
            Long meetingId,
            String type,
            Long senderUserId,
            String senderName,
            Long targetUserId,
            String sdp,
            String candidate,
            String sdpMid,
            Integer sdpMLineIndex
    ) {
    }
}
