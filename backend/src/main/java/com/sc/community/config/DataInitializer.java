package com.sc.community.config;

import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataInitializer(
            UserRepository userRepository,
            VerificationCodeRepository codeRepository,
            PasswordEncoder passwordEncoder,
            @Value("${APP_ADMIN_EMAIL:admin@scconnect.local}") String adminEmail,
            @Value("${APP_ADMIN_PASSWORD:Admin@12345}") String adminPassword) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(String... args) {
        User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> {
            User user = new User();
            user.setFullName("SC Community Admin");
            user.setEmail(adminEmail);
            user.setPassword(passwordEncoder.encode(adminPassword));
            user.setRole(UserRole.ROLE_ADMIN);
            user.setStatus(UserStatus.VERIFIED);
            return userRepository.save(user);
        });

        if (admin.getProfessionalGroup() == null) {
            admin.setProfessionalGroup(ProfessionalGroup.COMMUNITY);
            userRepository.save(admin);
        }

        if (!codeRepository.existsByCode("WELCOME-SC-2026")) {
            VerificationCode code = new VerificationCode();
            code.setCode("WELCOME-SC-2026");
            code.setCreatedByAdmin(admin);
            codeRepository.save(code);
        }
    }
}
