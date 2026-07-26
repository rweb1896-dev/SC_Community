package com.sc.community.service;

import com.sc.community.dto.MessageDtos.MessageResponse;
import com.sc.community.dto.MessageDtos.SendMessageRequest;
import com.sc.community.entity.Message;
import com.sc.community.entity.User;
import com.sc.community.repository.MessageRepository;
import com.sc.community.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository, CurrentUserService currentUserService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public MessageResponse send(SendMessageRequest request) {
        User sender = currentUserService.verifiedUser();
        User receiver = userRepository.findById(request.receiverId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setMessageBody(request.messageBody());
        return MessageResponse.from(messageRepository.save(message));
    }

    public List<MessageResponse> conversation(Long userId) {
        User current = currentUserService.verifiedUser();
        return messageRepository.conversation(current.getId(), userId).stream().map(MessageResponse::from).toList();
    }
}
