package com.sc.community.controller;

import com.sc.community.dto.MeetingDtos.MeetingResponse;
import com.sc.community.dto.MeetingDtos.RequestMeetingRequest;
import com.sc.community.service.MeetingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {
    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping
    public List<MeetingResponse> meetings() {
        return meetingService.meetings();
    }

    @GetMapping("/{meetingId}")
    public MeetingResponse meeting(@PathVariable Long meetingId) {
        return meetingService.meeting(meetingId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MeetingResponse request(@Valid @RequestBody RequestMeetingRequest request) {
        return meetingService.requestMeeting(request);
    }

    @PostMapping("/{meetingId}/join")
    public MeetingResponse join(@PathVariable Long meetingId) {
        return meetingService.join(meetingId);
    }

    @PostMapping("/{meetingId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@PathVariable Long meetingId) {
        meetingService.leave(meetingId);
    }

    @PostMapping("/{meetingId}/end")
    public MeetingResponse end(@PathVariable Long meetingId) {
        return meetingService.end(meetingId);
    }
}
