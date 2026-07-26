package com.sc.community.controller;

import com.sc.community.dto.MeetingDtos.MeetingSignalRequest;
import com.sc.community.dto.MeetingDtos.MeetingSignalResponse;
import com.sc.community.entity.User;
import com.sc.community.security.AppUserDetails;
import com.sc.community.service.MeetingService;
import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class MeetingSignalController {
    private final MeetingService meetingService;
    private final SimpMessagingTemplate messagingTemplate;

    public MeetingSignalController(MeetingService meetingService, SimpMessagingTemplate messagingTemplate) {
        this.meetingService = meetingService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/meetings/{meetingId}/signal")
    public void signal(
            @DestinationVariable Long meetingId,
            @Valid MeetingSignalRequest request,
            SimpMessageHeaderAccessor headers) {
        if (!(headers.getUser() instanceof Authentication authentication)
                || !(authentication.getPrincipal() instanceof AppUserDetails details)) {
            return;
        }

        User sender = meetingService.authorizeSignal(meetingId, details.getUser());
        MeetingSignalResponse response = new MeetingSignalResponse(
                meetingId,
                request.type().toUpperCase(),
                sender.getId(),
                sender.getFullName(),
                request.targetUserId(),
                request.sdp(),
                request.candidate(),
                request.sdpMid(),
                request.sdpMLineIndex()
        );
        messagingTemplate.convertAndSend("/topic/meetings/" + meetingId + "/signal", response);
    }
}
