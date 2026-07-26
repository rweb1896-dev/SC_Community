package com.sc.community.controller;

import com.sc.community.dto.MessageDtos.MessageResponse;
import com.sc.community.dto.MessageDtos.SendMessageRequest;
import com.sc.community.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/conversation/{userId}")
    public List<MessageResponse> conversation(@PathVariable Long userId) {
        return messageService.conversation(userId);
    }

    @PostMapping
    public MessageResponse sendRest(@Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.send(request);
        messagingTemplate.convertAndSend("/topic/messages/" + response.receiverId(), response);
        messagingTemplate.convertAndSend("/topic/messages/" + response.senderId(), response);
        return response;
    }

    @MessageMapping("/chat.send")
    public void sendSocket(@Valid SendMessageRequest request, SimpMessageHeaderAccessor headers) {
        SecurityContextHolder.getContext().setAuthentication((org.springframework.security.core.Authentication) headers.getUser());
        MessageResponse response = messageService.send(request);
        messagingTemplate.convertAndSend("/topic/messages/" + response.receiverId(), response);
        messagingTemplate.convertAndSend("/topic/messages/" + response.senderId(), response);
    }
}
