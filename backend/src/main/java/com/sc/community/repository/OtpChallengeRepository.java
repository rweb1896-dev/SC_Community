package com.sc.community.repository;

import com.sc.community.entity.OtpChallenge;
import com.sc.community.entity.OtpChannel;
import com.sc.community.entity.OtpPurpose;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {
    Optional<OtpChallenge> findTopByDestinationAndChannelAndPurposeOrderByCreatedAtDesc(
            String destination,
            OtpChannel channel,
            OtpPurpose purpose);

    Optional<OtpChallenge> findByVerificationToken(String verificationToken);
}
