package com.sc.community.service;

import com.sc.community.dto.ProfileDtos.UpdateProfileRequest;
import com.sc.community.dto.ProfileDtos.ProfileUpdateResponse;
import com.sc.community.dto.UserResponse;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.entity.User;
import com.sc.community.repository.UserRepository;
import com.sc.community.security.JwtService;
import jakarta.transaction.Transactional;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {
    private final CurrentUserService current;
    private final UserRepository users;
    private final OtpService otp;
    private final DirectoryService directory;
    private final JwtService jwt;

    public ProfileService(CurrentUserService current, UserRepository users, OtpService otp, DirectoryService directory, JwtService jwt) {
        this.current = current; this.users = users; this.otp = otp; this.directory = directory; this.jwt = jwt;
    }

    @Transactional
    public UserResponse me() { return directory.responseForUser(current.verifiedUser()); }

    @Transactional
    public ProfileUpdateResponse update(UpdateProfileRequest request) {
        User user = users.findById(current.verifiedUser().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String phone = request.phoneNumber().replaceAll("[\\s()\\-]", "");
        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());
        boolean phoneChanged = !phone.equals(user.getPhoneNumber());
        if (emailChanged) {
            if (request.emailVerificationToken() == null || request.emailVerificationToken().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verify the new email before saving");
            users.findByEmail(email).filter(other -> !other.getId().equals(user.getId())).ifPresent(other -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
            });
            otp.consumeVerification(request.emailVerificationToken(), OtpChannel.EMAIL, OtpPurpose.PROFILE_EMAIL, email);
        }
        if (phoneChanged) {
            if (request.phoneVerificationToken() == null || request.phoneVerificationToken().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verify the new mobile number before saving");
            users.findByPhoneNumber(phone).filter(other -> !other.getId().equals(user.getId())).ifPresent(other -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mobile number is already registered");
            });
            otp.consumeVerification(request.phoneVerificationToken(), OtpChannel.MOBILE, OtpPurpose.PROFILE_MOBILE, phone);
        }
        user.setFullName(request.fullName().trim()); user.setEmail(email); user.setPhoneNumber(phone);
        users.save(user);
        directory.saveProfile(user, request.address(), request.photoUrl(), request.currentPost(), request.position(),
                request.school(), request.college(), request.bestAchievement(), request.profileCategory(),
                request.workStatus(), request.employmentType());
        return new ProfileUpdateResponse(directory.responseForUser(user), jwt.generateToken(user));
    }
}
