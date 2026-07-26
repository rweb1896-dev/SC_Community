package com.sc.community.websocket;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PresenceService {
    private final ConcurrentHashMap<Long, Set<String>> sessionsByUser = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> usersBySession = new ConcurrentHashMap<>();

    public void connected(Long userId, String sessionId) {
        usersBySession.put(sessionId, userId);
        sessionsByUser.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void disconnected(String sessionId) {
        Long userId = usersBySession.remove(sessionId);
        if (userId == null) {
            return;
        }
        sessionsByUser.computeIfPresent(userId, (ignored, sessions) -> {
            sessions.remove(sessionId);
            return sessions.isEmpty() ? null : sessions;
        });
    }

    public Set<Long> onlineUserIds() {
        return Set.copyOf(sessionsByUser.keySet());
    }
}
