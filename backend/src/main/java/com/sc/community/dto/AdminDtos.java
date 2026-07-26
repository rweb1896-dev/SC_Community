package com.sc.community.dto;

import com.sc.community.entity.VerificationCode;
import com.sc.community.entity.ProfessionalGroup;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record DashboardResponse(long totalUsers, long pendingUsers, long verifiedUsers, long blockedUsers, long activePosts) {
    }

    public record InviteCodeResponse(Long id, String code, boolean used, Instant createdAt) {
        public static InviteCodeResponse from(VerificationCode code) {
            return new InviteCodeResponse(code.getId(), code.getCode(), code.isUsed(), code.getCreatedAt());
        }
    }

    public record UpdateProfessionalGroupRequest(@NotNull ProfessionalGroup professionalGroup) {
    }
}
