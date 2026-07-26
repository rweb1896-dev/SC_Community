package com.sc.community.websocket;

import com.sc.community.security.AppUserDetailsService;
import com.sc.community.security.JwtService;
import java.util.List;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    private final AppUserDetailsService userDetailsService;

    public WebSocketAuthChannelInterceptor(JwtService jwtService, AppUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> values = accessor.getNativeHeader("Authorization");
            if (values != null && !values.isEmpty() && values.get(0).startsWith("Bearer ")) {
                String token = values.get(0).substring(7);
                String email = jwtService.extractUsername(token);
                UserDetails details = userDetailsService.loadUserByUsername(email);
                if (jwtService.isValid(token, details)) {
                    accessor.setUser(new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities()));
                }
            }
        }
        return message;
    }
}
