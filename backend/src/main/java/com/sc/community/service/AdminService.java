package com.sc.community.service;

import com.sc.community.dto.AdminDtos.DashboardResponse;
import com.sc.community.dto.AdminDtos.InviteCodeResponse;
import com.sc.community.dto.UserResponse;
import com.sc.community.entity.Post;
import com.sc.community.entity.PostStatus;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.User;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.PostRepository;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final VerificationCodeRepository codeRepository;
    private final CurrentUserService currentUserService;
    private final SecureRandom random = new SecureRandom();

    public AdminService(UserRepository userRepository, PostRepository postRepository, VerificationCodeRepository codeRepository, CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.codeRepository = codeRepository;
        this.currentUserService = currentUserService;
    }

    public DashboardResponse dashboard() {
        List<User> users = userRepository.findAll();
        return new DashboardResponse(
                users.size(),
                users.stream().filter(user -> user.getStatus() == UserStatus.PENDING).count(),
                users.stream().filter(user -> user.getStatus() == UserStatus.VERIFIED).count(),
                users.stream().filter(user -> user.getStatus() == UserStatus.BLOCKED).count(),
                postRepository.findByStatusOrderByCreatedAtDesc(PostStatus.ACTIVE).size()
        );
    }

    public List<UserResponse> users() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse setUserStatus(Long userId, UserStatus status) {
        User current = currentUserService.currentUser();
        if (current.getId().equals(userId) && status == UserStatus.BLOCKED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin cannot block their own account");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(status);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse setProfessionalGroup(Long userId, ProfessionalGroup professionalGroup) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setProfessionalGroup(professionalGroup);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void hidePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        post.setStatus(PostStatus.BLOCKED);
        postRepository.save(post);
    }

    @Transactional
    public InviteCodeResponse generateInviteCode() {
        VerificationCode code = new VerificationCode();
        String value;
        do {
            byte[] bytes = new byte[6];
            random.nextBytes(bytes);
            value = "SC-" + HexFormat.of().formatHex(bytes).toUpperCase();
        } while (codeRepository.existsByCode(value));

        code.setCode(value);
        code.setCreatedByAdmin(currentUserService.currentUser());
        return InviteCodeResponse.from(codeRepository.save(code));
    }

    public List<InviteCodeResponse> codes() {
        return codeRepository.findAll().stream().map(InviteCodeResponse::from).toList();
    }
}
