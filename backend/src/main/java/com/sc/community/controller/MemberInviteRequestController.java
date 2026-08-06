package com.sc.community.controller;

import com.sc.community.dto.MemberInviteRequestDtos.CreateMemberInviteRequest;
import com.sc.community.dto.MemberInviteRequestDtos.MemberInviteRequestResponse;
import com.sc.community.service.MemberInviteRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invite-requests")
public class MemberInviteRequestController {
    private final MemberInviteRequestService service;
    public MemberInviteRequestController(MemberInviteRequestService service) { this.service = service; }

    @GetMapping("/mine")
    public List<MemberInviteRequestResponse> mine() { return service.mine(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberInviteRequestResponse create(@Valid @RequestBody CreateMemberInviteRequest request) {
        return service.create(request);
    }
}
