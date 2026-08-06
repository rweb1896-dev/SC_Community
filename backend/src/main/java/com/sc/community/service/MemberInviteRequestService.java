package com.sc.community.service;

import com.sc.community.dto.MemberInviteRequestDtos.CreateMemberInviteRequest;
import com.sc.community.dto.MemberInviteRequestDtos.MemberInviteRequestResponse;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.User;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MemberInviteRequestService {
    private static final String PREFIX = "MEMBER_INVITE\n";
    private static final String PENDING = "PENDING";
    private static final String REJECTED = "REJECTED:";
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private final OtpChallengeRepository repository;
    private final CurrentUserService currentUserService;
    private final AdminService adminService;
    private final UserRepository userRepository;

    public MemberInviteRequestService(OtpChallengeRepository repository, CurrentUserService currentUserService,
            AdminService adminService, UserRepository userRepository) {
        this.repository = repository;
        this.currentUserService = currentUserService;
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    @Transactional
    public MemberInviteRequestResponse create(CreateMemberInviteRequest request) {
        User user = currentUserService.verifiedUser();
        String email = clean(request.recipientEmail()).toLowerCase();
        String mobile = clean(request.recipientMobile()).replaceAll("[\\s()-]", "");
        if (email.isBlank() && mobile.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter the invitee email or mobile number");
        }
        if (!email.isBlank() && !EMAIL.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid invitee email");
        }
        List<OtpChallenge> mine = repository.findByPurposeAndDestinationStartingWithOrderByCreatedAtDesc(
                OtpPurpose.PASSWORD_RESET, prefix(user.getId()));
        OtpChallenge pending = mine.stream().filter(item -> item.getVerifiedAt() == null && item.getUsedAt() == null)
                .findFirst().orElse(null);
        if (pending != null) return response(pending);

        OtpChallenge item = new OtpChallenge();
        String requesterName = user.getFullName().substring(0, Math.min(user.getFullName().length(), 60));
        item.setDestination(String.join("\n", "MEMBER_INVITE", user.getId().toString(), requesterName, email, mobile));
        item.setChannel(OtpChannel.EMAIL);
        item.setPurpose(OtpPurpose.PASSWORD_RESET);
        item.setCodeHash(PENDING);
        item.setVerificationToken(UUID.randomUUID().toString().replace("-", ""));
        item.setExpiresAt(Instant.now().plus(Duration.ofDays(30)));
        return response(repository.save(item));
    }

    public List<MemberInviteRequestResponse> mine() {
        User user = currentUserService.verifiedUser();
        return repository.findByPurposeAndDestinationStartingWithOrderByCreatedAtDesc(
                OtpPurpose.PASSWORD_RESET, prefix(user.getId())).stream().map(this::response).limit(10).toList();
    }

    public List<MemberInviteRequestResponse> pending() {
        return repository.findByPurposeAndDestinationStartingWithAndVerifiedAtIsNullAndUsedAtIsNullOrderByCreatedAtAsc(
                OtpPurpose.PASSWORD_RESET, PREFIX).stream().map(this::response).toList();
    }

    @Transactional
    public MemberInviteRequestResponse approve(Long id) {
        OtpChallenge item = find(id);
        if (item.getVerifiedAt() == null && item.getUsedAt() == null) {
            VerificationCode code = adminService.createInviteCode();
            item.setCodeHash(code.getCode());
            item.setVerifiedAt(Instant.now());
            repository.save(item);
        }
        return response(item);
    }

    @Transactional
    public MemberInviteRequestResponse reject(Long id, String reason) {
        OtpChallenge item = find(id);
        if (item.getVerifiedAt() == null && item.getUsedAt() == null) {
            String cleanReason = clean(reason);
            item.setCodeHash(REJECTED + (cleanReason.isBlank() ? "Request was not approved" : cleanReason));
            item.setUsedAt(Instant.now());
            repository.save(item);
        }
        return response(item);
    }

    private OtpChallenge find(Long id) {
        return repository.findById(id).filter(item -> item.getPurpose() == OtpPurpose.PASSWORD_RESET)
                .filter(item -> item.getDestination().startsWith(PREFIX))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member invite request not found"));
    }

    private MemberInviteRequestResponse response(OtpChallenge item) {
        String[] parts = item.getDestination().split("\n", 5);
        if (parts.length != 5) throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Member invite request data is invalid");
        String requesterEmail = userRepository.findById(Long.parseLong(parts[1])).map(User::getEmail).orElse("");
        boolean approved = item.getVerifiedAt() != null;
        boolean rejected = item.getUsedAt() != null && item.getCodeHash().startsWith(REJECTED);
        return new MemberInviteRequestResponse(item.getId(), parts[2], requesterEmail, parts[3], parts[4],
                approved ? "APPROVED" : rejected ? "REJECTED" : "PENDING",
                approved ? item.getCodeHash() : null,
                rejected ? item.getCodeHash().substring(REJECTED.length()) : null,
                item.getCreatedAt(), approved ? item.getVerifiedAt() : rejected ? item.getUsedAt() : null);
    }

    private String prefix(Long userId) { return PREFIX + userId + "\n"; }
    private String clean(String value) { return value == null ? "" : value.trim(); }
}
