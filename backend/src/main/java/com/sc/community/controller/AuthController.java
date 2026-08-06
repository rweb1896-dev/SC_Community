package com.sc.community.controller;

import com.sc.community.dto.AuthResponse;
import com.sc.community.dto.LoginRequest;
import com.sc.community.dto.RegisterRequest;
import com.sc.community.dto.UserResponse;
import com.sc.community.dto.OtpDtos.MessageResponse;
import com.sc.community.dto.OtpDtos.OtpRequest;
import com.sc.community.dto.OtpDtos.OtpRequestResponse;
import com.sc.community.dto.OtpDtos.OtpVerifyRequest;
import com.sc.community.dto.OtpDtos.OtpVerifyResponse;
import com.sc.community.dto.OtpDtos.PasswordResetRequest;
import com.sc.community.dto.InviteRequestDtos.CreateInviteRequest;
import com.sc.community.dto.InviteRequestDtos.InviteRequestResponse;
import com.sc.community.service.AuthService;
import com.sc.community.service.InviteRequestService;
import com.sc.community.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final OtpService otpService;
    private final InviteRequestService inviteRequestService;

    public AuthController(AuthService authService, OtpService otpService, InviteRequestService inviteRequestService) {
        this.authService = authService;
        this.otpService = otpService;
        this.inviteRequestService = inviteRequestService;
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/otp/request")
    public OtpRequestResponse requestOtp(@Valid @RequestBody OtpRequest request) {
        return otpService.request(request);
    }

    @PostMapping("/otp/verify")
    public OtpVerifyResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return otpService.verify(request);
    }

    @PostMapping("/password/reset")
    public MessageResponse resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        return otpService.resetPassword(request);
    }

    @PostMapping("/invite-requests")
    public InviteRequestResponse requestInvite(@Valid @RequestBody CreateInviteRequest request) {
        return inviteRequestService.create(request);
    }

    @PostMapping("/invite-requests/{requestToken}/status")
    public InviteRequestResponse inviteRequestStatus(@PathVariable String requestToken) {
        return inviteRequestService.status(requestToken);
    }
}
