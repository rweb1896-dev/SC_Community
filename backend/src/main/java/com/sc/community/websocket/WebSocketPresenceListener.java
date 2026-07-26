package com.sc.community.websocket;

import com.sc.community.security.AppUserDetails;
import java.util.Map;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketPresenceListener {
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketPresenceListener(PresenceService presenceService, SimpMessagingTemplate messagingTemplate) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void connected(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        if (!(headers.getUser() instanceof Authentication authentication) || headers.getSessionId() == null) {
            return;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserDetails details) {
            presenceService.connected(details.getUser().getId(), headers.getSessionId());
            broadcast();
        }
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) {
        presenceService.disconnected(event.getSessionId());
        broadcast();
    }

    private void broadcast() {
        messagingTemplate.convertAndSend(
                "/topic/presence",
                Map.of("onlineUserIds", presenceService.onlineUserIds())
        );
    }
}
