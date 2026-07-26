package com.sc.community.controller;

import com.sc.community.dto.MeetingDtos.MeetingResponse;
import com.sc.community.dto.MeetingDtos.RejectMeetingRequest;
import com.sc.community.service.MeetingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/meetings")
public class AdminMeetingController {
    private final MeetingService meetingService;

    public AdminMeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping("/pending")
    public List<MeetingResponse> pending() {
        return meetingService.pendingMeetings();
    }

    @PatchMapping("/{meetingId}/approve")
    public MeetingResponse approve(@PathVariable Long meetingId) {
        return meetingService.approve(meetingId);
    }

    @PatchMapping("/{meetingId}/reject")
    public MeetingResponse reject(
            @PathVariable Long meetingId,
            @Valid @RequestBody(required = false) RejectMeetingRequest request) {
        return meetingService.reject(meetingId, request == null ? null : request.reason());
    }
}
