package com.sc.community.config;

import com.sc.community.entity.CommunityEvent;
import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.CommunityEventRepository;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final CommunityEventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final boolean defaultInviteEnabled;
    private final boolean sampleContentEnabled;

    public DataInitializer(
            UserRepository userRepository,
            VerificationCodeRepository codeRepository,
            CommunityEventRepository eventRepository,
            PasswordEncoder passwordEncoder,
            @Value("${APP_ADMIN_EMAIL:admin@scconnect.local}") String adminEmail,
            @Value("${APP_ADMIN_PASSWORD:Admin@12345}") String adminPassword,
            @Value("${app.bootstrap.default-invite-enabled:true}") boolean defaultInviteEnabled,
            @Value("${app.bootstrap.sample-content-enabled:true}") boolean sampleContentEnabled) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.defaultInviteEnabled = defaultInviteEnabled;
        this.sampleContentEnabled = sampleContentEnabled;
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

        if (defaultInviteEnabled && !codeRepository.existsByCode("WELCOME-SC-2026")) {
            VerificationCode code = new VerificationCode();
            code.setCode("WELCOME-SC-2026");
            code.setCreatedByAdmin(admin);
            codeRepository.save(code);
        }

        if (sampleContentEnabled && eventRepository.count() == 0) {
            eventRepository.save(event(
                    "Community legal awareness clinic",
                    "A practical session on constitutional rights, documentation and access to public legal support.",
                    "SC Community Hall and online",
                    scheduledAt(7, 11, 0)));
            eventRepository.save(event(
                    "Education and scholarship help desk",
                    "Guidance for students and families on applications, documents, deadlines and verified scholarship sources.",
                    "Online community room",
                    scheduledAt(14, 16, 0)));
        }
    }

    private CommunityEvent event(String title, String summary, String venue, Instant eventAt) {
        CommunityEvent event = new CommunityEvent();
        event.setTitle(title);
        event.setSummary(summary);
        event.setVenue(venue);
        event.setEventAt(eventAt);
        return event;
    }

    private Instant scheduledAt(int daysFromNow, int hour, int minute) {
        return ZonedDateTime.now(ZoneId.of("Asia/Kolkata"))
                .plus(daysFromNow, ChronoUnit.DAYS)
                .withHour(hour)
                .withMinute(minute)
                .withSecond(0)
                .withNano(0)
                .toInstant();
    }
}
