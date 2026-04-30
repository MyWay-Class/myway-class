package com.myway.backendspring.auth;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {
    private final Map<String, DemoUser> sessions = new ConcurrentHashMap<>();

    public Optional<DemoUser> findUser(String userId) {
        return DemoUsers.USERS.stream().filter(u -> u.id().equals(userId)).findFirst();
    }

    public SessionView login(DemoUser user) {
        String token = "sess_" + UUID.randomUUID();
        sessions.put(token, user);
        return new SessionView(token, user, DemoUsers.ROLE_PERMISSIONS.getOrDefault(user.role(), java.util.List.of()));
    }

    public SessionView me(String authHeader) {
        String token = extractToken(authHeader);
        if (token == null) {
            return null;
        }
        DemoUser user = sessions.get(token);
        if (user == null) {
            return null;
        }
        return new SessionView(token, user, DemoUsers.ROLE_PERMISSIONS.getOrDefault(user.role(), java.util.List.of()));
    }

    public void logout(String authHeader) {
        String token = extractToken(authHeader);
        if (token != null) {
            sessions.remove(token);
        }
    }

    private String extractToken(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return null;
        }
        if (!authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring("Bearer ".length()).trim();
    }
}
