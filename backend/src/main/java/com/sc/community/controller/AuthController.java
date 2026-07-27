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
import com.sc.community.service.AuthService;
import com.sc.community.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final OtpService otpService;

    public AuthController(AuthService authService, OtpService otpService) {
        this.authService = authService;
        this.otpService = otpService;
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
}
