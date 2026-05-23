package com.myway.backendspring.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SessionService {
    private static final Duration DEFAULT_TOKEN_TTL = Duration.ofHours(12);

    private final AuthJdbcStore authJdbcStore;
    private final SecretKey jwtKey;
    private final Duration tokenTtl;

    public SessionService(
            AuthJdbcStore authJdbcStore,
            @Value("${myway.auth.jwt.secret:myway-class-dev-secret-key-change-me-32bytes}") String jwtSecret,
            @Value("${myway.auth.jwt.ttl-hours:12}") long tokenTtlHours
    ) {
        this.authJdbcStore = authJdbcStore;
        String resolvedSecret = (jwtSecret == null || jwtSecret.isBlank())
                ? "myway-class-dev-secret-key-change-me-32bytes"
                : jwtSecret.trim();
        this.jwtKey = Keys.hmacShaKeyFor(normalizeSecret(resolvedSecret).getBytes(StandardCharsets.UTF_8));
        this.tokenTtl = tokenTtlHours <= 0 ? DEFAULT_TOKEN_TTL : Duration.ofHours(tokenTtlHours);
    }

    @PostConstruct
    void seedDemoUsers() {
        for (DemoUser user : DemoUsers.USERS) {
            authJdbcStore.upsertUser(user);
        }
    }

    public Optional<DemoUser> findUser(String userId) {
        return authJdbcStore.findUserById(userId);
    }

    public List<DemoUser> listUsers() {
        return authJdbcStore.listUsers();
    }

    public SessionView login(DemoUser user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(tokenTtl);
        String tokenId = "sid_" + UUID.randomUUID();
        String token = Jwts.builder()
                .subject(user.id())
                .id(tokenId)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .claim("role", user.role())
                .signWith(jwtKey)
                .compact();
        authJdbcStore.upsertSession(tokenId, user.id(), issuedAt, expiresAt);
        return new SessionView(token, user, DemoUsers.ROLE_PERMISSIONS.getOrDefault(user.role(), java.util.List.of()));
    }

    public SessionView me(String authHeader) {
        String token = extractToken(authHeader);
        if (token == null) {
            return null;
        }
        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(jwtKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception ignored) {
            return null;
        }
        String tokenId = claims.getId();
        String userId = claims.getSubject();
        if (tokenId == null || tokenId.isBlank() || userId == null || userId.isBlank()) {
            return null;
        }
        AuthJdbcStore.SessionRecord session = authJdbcStore.findActiveSession(tokenId).orElse(null);
        if (session == null || !userId.equals(session.userId())) {
            return null;
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            authJdbcStore.revokeSession(tokenId);
            return null;
        }
        DemoUser user = authJdbcStore.findUserById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        return new SessionView(token, user, DemoUsers.ROLE_PERMISSIONS.getOrDefault(user.role(), java.util.List.of()));
    }

    public void logout(String authHeader) {
        String token = extractToken(authHeader);
        if (token == null) {
            return;
        }
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(jwtKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            String tokenId = claims.getId();
            if (tokenId != null && !tokenId.isBlank()) {
                authJdbcStore.revokeSession(tokenId);
            }
        } catch (Exception ignored) {
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

    private String normalizeSecret(String raw) {
        String secret = raw == null ? "" : raw.trim();
        if (secret.length() >= 32) {
            return secret;
        }
        StringBuilder builder = new StringBuilder(secret);
        while (builder.length() < 32) {
            builder.append("0");
        }
        return builder.toString();
    }
}
