package com.sc.community.controller;

import com.sc.community.dto.AdminDtos.DashboardResponse;
import com.sc.community.dto.AdminDtos.InviteCodeResponse;
import com.sc.community.dto.AdminDtos.UpdateProfessionalGroupRequest;
import com.sc.community.dto.UserResponse;
import com.sc.community.dto.InviteRequestDtos.InviteRequestResponse;
import com.sc.community.entity.UserStatus;
import com.sc.community.service.AdminService;
import com.sc.community.service.InviteRequestService;
import java.util.List;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final InviteRequestService inviteRequestService;

    public AdminController(AdminService adminService, InviteRequestService inviteRequestService) {
        this.adminService = adminService;
        this.inviteRequestService = inviteRequestService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/users")
    public List<UserResponse> users() {
        return adminService.users();
    }

    @PatchMapping("/users/{userId}/approve")
    public UserResponse approve(@PathVariable Long userId) {
        return adminService.setUserStatus(userId, UserStatus.VERIFIED);
    }

    @PatchMapping("/users/{userId}/block")
    public UserResponse block(@PathVariable Long userId) {
        return adminService.setUserStatus(userId, UserStatus.BLOCKED);
    }

    @PatchMapping("/users/{userId}/unblock")
    public UserResponse unblock(@PathVariable Long userId) {
        return adminService.setUserStatus(userId, UserStatus.VERIFIED);
    }

    @PatchMapping("/users/{userId}/professional-group")
    public UserResponse professionalGroup(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateProfessionalGroupRequest request) {
        return adminService.setProfessionalGroup(userId, request.professionalGroup());
    }

    @DeleteMapping("/posts/{postId}")
    public void deletePost(@PathVariable Long postId) {
        adminService.hidePost(postId);
    }

    @PostMapping("/invite-codes")
    public InviteCodeResponse generateInviteCode() {
        return adminService.generateInviteCode();
    }

    @GetMapping("/invite-codes")
    public List<InviteCodeResponse> codes() {
        return adminService.codes();
    }

    @GetMapping("/invite-requests")
    public List<InviteRequestResponse> inviteRequests() {
        return inviteRequestService.pending();
    }

    @PatchMapping("/invite-requests/{requestId}/approve")
    public InviteRequestResponse approveInviteRequest(@PathVariable Long requestId) {
        return inviteRequestService.approve(requestId);
    }
}
