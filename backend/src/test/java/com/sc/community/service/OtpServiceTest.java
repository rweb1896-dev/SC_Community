package com.sc.community.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.sc.community.dto.OtpDtos.OtpRequest;
import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import com.sc.community.repository.OtpChallengeRepository;
import com.sc.community.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {
    @Mock private OtpChallengeRepository challengeRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private OtpService service;
    private List<OtpChallenge> savedChallenges;

    @BeforeEach
    void setUp() {
        savedChallenges = new ArrayList<>();
        when(passwordEncoder.encode(any(String.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(challengeRepository.save(any(OtpChallenge.class))).thenAnswer(invocation -> {
            OtpChallenge challenge = invocation.getArgument(0);
            savedChallenges.add(challenge);
            return challenge;
        });
        service = new OtpService(
                challengeRepository,
                userRepository,
                passwordEncoder,
                "sc1e",
                "sc2m",
                false,
                10,
                0);
    }

    @Test
    void usesSeparateDefaultCodesForEmailAndMobile() {
        service.request(new OtpRequest(OtpChannel.EMAIL, OtpPurpose.SIGNUP_EMAIL, "Member@Example.com"));
        service.request(new OtpRequest(OtpChannel.MOBILE, OtpPurpose.SIGNUP_MOBILE, "+919876543210"));

        assertThat(savedChallenges).hasSize(2);
        assertThat(savedChallenges.get(0).getCodeHash()).isEqualTo("SC1E");
        assertThat(savedChallenges.get(0).getDestination()).isEqualTo("member@example.com");
        assertThat(savedChallenges.get(1).getCodeHash()).isEqualTo("SC2M");
        assertThat(savedChallenges.get(1).getDestination()).isEqualTo("+919876543210");
    }
}
