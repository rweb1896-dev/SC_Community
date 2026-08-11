package com.sc.community.controller;

import com.sc.community.dto.UserResponse;
import com.sc.community.entity.UserStatus;
import com.sc.community.repository.UserRepository;
import com.sc.community.websocket.PresenceService;
import com.sc.community.dto.DirectoryDtos.UpdateHelpFieldsRequest;
import com.sc.community.service.DirectoryService;
import com.sc.community.service.ProfileService;
import com.sc.community.dto.ProfileDtos.UpdateProfileRequest;
import com.sc.community.dto.ProfileDtos.ProfileUpdateResponse;
import jakarta.validation.Valid;
import java.util.Set;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final DirectoryService directoryService;
    private final ProfileService profileService;

    public UserController(UserRepository userRepository, PresenceService presenceService, DirectoryService directoryService, ProfileService profileService) {
        this.userRepository = userRepository;
        this.presenceService = presenceService;
        this.directoryService = directoryService;
        this.profileService = profileService;
    }

    @GetMapping("/verified")
    public List<UserResponse> verifiedUsers() {
        return userRepository.findByStatus(UserStatus.VERIFIED).stream().map(directoryService::responseForUser).toList();
    }

    @GetMapping("/online")
    public Set<Long> onlineUsers() {
        return presenceService.onlineUserIds();
    }

    @PatchMapping("/me/help-fields")
    public UserResponse updateMyHelpFields(@Valid @RequestBody UpdateHelpFieldsRequest request) {
        return directoryService.updateMyHelpFields(request.fieldIds());
    }

    @GetMapping("/me")
    public UserResponse me() { return profileService.me(); }

    @PatchMapping("/me/profile")
    public ProfileUpdateResponse updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.update(request);
    }
}
