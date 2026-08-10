package com.sc.community.config;

import com.sc.community.entity.CommunityEvent;
import com.sc.community.entity.Category;
import com.sc.community.entity.User;
import com.sc.community.entity.UserRole;
import com.sc.community.entity.UserStatus;
import com.sc.community.entity.ProfessionalGroup;
import com.sc.community.entity.VerificationCode;
import com.sc.community.repository.CommunityEventRepository;
import com.sc.community.repository.CategoryRepository;
import com.sc.community.repository.UserRepository;
import com.sc.community.repository.VerificationCodeRepository;
import com.sc.community.entity.ExpertiseField;
import com.sc.community.repository.ExpertiseFieldRepository;
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
    private final CategoryRepository categoryRepository;
    private final ExpertiseFieldRepository expertiseFieldRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final boolean defaultInviteEnabled;
    private final boolean sampleContentEnabled;

    public DataInitializer(
            UserRepository userRepository,
            VerificationCodeRepository codeRepository,
            CommunityEventRepository eventRepository,
            CategoryRepository categoryRepository,
            ExpertiseFieldRepository expertiseFieldRepository,
            PasswordEncoder passwordEncoder,
            @Value("${APP_ADMIN_EMAIL:admin@scconnect.local}") String adminEmail,
            @Value("${APP_ADMIN_PASSWORD:Admin@12345}") String adminPassword,
            @Value("${app.bootstrap.default-invite-enabled:true}") boolean defaultInviteEnabled,
            @Value("${app.bootstrap.sample-content-enabled:true}") boolean sampleContentEnabled) {
        this.userRepository = userRepository;
        this.codeRepository = codeRepository;
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.expertiseFieldRepository = expertiseFieldRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.defaultInviteEnabled = defaultInviteEnabled;
        this.sampleContentEnabled = sampleContentEnabled;
    }

    @Override
    public void run(String... args) {
        seedCategory("Health Help", "Requests and resources for medical help, blood donation, care, and wellness.");
        seedCategory("Job Updates", "Career opportunities, referrals, exam alerts, and professional guidance.");
        seedCategory("Business Growth", "Local businesses, entrepreneurship, vendor support, and collaboration.");
        seedCategory("Open Forum/SOS", "Community discussions, urgent support, and open announcements.");
        seedExpertiseField("UPSC & Civil Services", "Guidance for UPSC, state services and public administration careers.", "AWARD", 10);
        seedExpertiseField("Music & Performing Arts", "Mentoring in singing, music, stage performance and creative practice.", "MUSIC", 20);
        seedExpertiseField("Judiciary Preparation", "Support for judicial service examinations and legal study planning.", "SCALE", 30);
        seedExpertiseField("Law & Legal Assistance", "Professional legal awareness, advocacy and access-to-justice guidance.", "GAVEL", 40);
        seedExpertiseField("Business & Entrepreneurship", "Support for enterprise, finance, markets and business growth.", "BRIEFCASE", 50);
        seedExpertiseField("Medicine & Healthcare", "Health education, medical careers and verified care navigation.", "HEART", 60);
        seedExpertiseField("Government & Public Service", "Experience in governance, ministries, policy and public programmes.", "LANDMARK", 70);
        seedExpertiseField("Education & Mentoring", "Academic guidance, teaching, scholarships and student mentoring.", "BOOK", 80);
        seedExpertiseField("Engineering & Technology", "Technical careers, engineering practice and digital skills.", "CODE", 90);
        seedExpertiseField("Community & Social Work", "Community mobilisation, welfare access and grassroots support.", "USERS", 100);

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

    private void seedCategory(String name, String description) {
        if (categoryRepository.findByName(name).isPresent()) return;
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        categoryRepository.save(category);
    }

    private void seedExpertiseField(String name, String description, String iconKey, int displayOrder) {
        if (expertiseFieldRepository.findByNameIgnoreCase(name).isPresent()) return;
        ExpertiseField field = new ExpertiseField();
        field.setName(name);
        field.setDescription(description);
        field.setIconKey(iconKey);
        field.setDisplayOrder(displayOrder);
        field.setActive(true);
        expertiseFieldRepository.save(field);
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
