package com.sc.community.controller;

import com.sc.community.dto.UserResponse;
import com.sc.community.entity.UserStatus;
import com.sc.community.repository.UserRepository;
import com.sc.community.websocket.PresenceService;
import java.util.Set;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    public UserController(UserRepository userRepository, PresenceService presenceService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    @GetMapping("/verified")
    public List<UserResponse> verifiedUsers() {
        return userRepository.findByStatus(UserStatus.VERIFIED).stream().map(UserResponse::from).toList();
    }

    @GetMapping("/online")
    public Set<Long> onlineUsers() {
        return presenceService.onlineUserIds();
    }
}
