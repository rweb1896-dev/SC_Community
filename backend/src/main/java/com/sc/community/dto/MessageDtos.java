package com.sc.community.dto;

import com.sc.community.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public final class MessageDtos {
    private MessageDtos() {
    }

    public record SendMessageRequest(@NotNull Long receiverId, @NotBlank String messageBody) {
    }

    public record MessageResponse(Long id, Long senderId, Long receiverId, String messageBody, boolean read, Instant timestamp) {
        public static MessageResponse from(Message message) {
            return new MessageResponse(
                    message.getId(),
                    message.getSender().getId(),
                    message.getReceiver().getId(),
                    message.getMessageBody(),
                    message.isRead(),
                    message.getTimestamp()
            );
        }
    }
}
