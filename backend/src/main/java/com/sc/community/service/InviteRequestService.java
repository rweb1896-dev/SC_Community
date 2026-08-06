package com.sc.community.service;

import com.sc.community.dto.InviteRequestDtos.CreateInviteRequest;
import com.sc.community.dto.InviteRequestDtos.InviteRequestResponse;
import com.sc.community.entity.InviteRequest;
import com.sc.community.entity.InviteRequestStatus;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.InviteRequestRepository;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InviteRequestService {
    private final InviteRequestRepository requestRepository;
    private final OtpService otpService;
    private final AdminService adminService;
    private final CurrentUserService currentUserService;

    public InviteRequestService(
            InviteRequestRepository requestRepository,
            OtpService otpService,
            AdminService adminService,
            CurrentUserService currentUserService) {
        this.requestRepository = requestRepository;
        this.otpService = otpService;
        this.adminService = adminService;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public InviteRequestResponse create(CreateInviteRequest request) {
        String email = otpService.normalizeDestination(OtpChannel.EMAIL, request.email());
        String phoneNumber = otpService.normalizeDestination(OtpChannel.MOBILE, request.phoneNumber());
        otpService.validateVerification(
                request.emailVerificationToken(), OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, email);
        otpService.validateVerification(
                request.phoneVerificationToken(), OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, phoneNumber);

        List<InviteRequest> matching = requestRepository.findMatching(
                InviteRequestStatus.PENDING, email, phoneNumber);
        if (!matching.isEmpty()) {
            return InviteRequestResponse.from(matching.get(0));
        }

        InviteRequest inviteRequest = new InviteRequest();
        inviteRequest.setRequestToken(UUID.randomUUID().toString().replace("-", ""));
        inviteRequest.setFullName(request.fullName().trim());
        inviteRequest.setEmail(email);
        inviteRequest.setPhoneNumber(phoneNumber);
        return InviteRequestResponse.from(requestRepository.save(inviteRequest));
    }

    public InviteRequestResponse status(String requestToken) {
        return InviteRequestResponse.from(requestRepository.findByRequestToken(requestToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite request not found")));
    }

    public List<InviteRequestResponse> pending() {
        return requestRepository.findByStatusOrderByRequestedAtAsc(InviteRequestStatus.PENDING)
                .stream()
                .map(InviteRequestResponse::from)
                .toList();
    }

    @Transactional
    public InviteRequestResponse approve(Long requestId) {
        InviteRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite request not found"));
        if (request.getStatus() == InviteRequestStatus.APPROVED) {
            return InviteRequestResponse.from(request);
        }

        VerificationCode code = adminService.createInviteCode();
        request.setVerificationCode(code);
        request.setReviewedByAdmin(currentUserService.currentUser());
        request.setStatus(InviteRequestStatus.APPROVED);
        request.setApprovedAt(Instant.now());
        return InviteRequestResponse.from(requestRepository.save(request));
    }
}
