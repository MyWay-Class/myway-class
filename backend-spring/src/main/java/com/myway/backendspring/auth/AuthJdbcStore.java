package com.myway.backendspring.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class AuthJdbcStore {
    private final JdbcTemplate jdbcTemplate;

    public AuthJdbcStore(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<DemoUser> findUserById(String userId) {
        List<DemoUser> rows = jdbcTemplate.query(
                """
                SELECT id, name, email, role, department, bio
                FROM auth_users
                WHERE id = ?
                """,
                (rs, rowNum) -> new DemoUser(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("role"),
                        rs.getString("department"),
                        rs.getString("bio")
                ),
                userId
        );
        return rows.stream().findFirst();
    }

    public List<DemoUser> listUsers() {
        return jdbcTemplate.query(
                """
                SELECT id, name, email, role, department, bio
                FROM auth_users
                ORDER BY id
                """,
                (rs, rowNum) -> new DemoUser(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("email"),
                        rs.getString("role"),
                        rs.getString("department"),
                        rs.getString("bio")
                )
        );
    }

    public void upsertUser(DemoUser user) {
        int updated = jdbcTemplate.update(
                """
                UPDATE auth_users
                SET name = ?, email = ?, role = ?, department = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                user.name(), user.email(), user.role(), user.department(), user.bio(), user.id()
        );
        if (updated > 0) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO auth_users(id, name, email, role, department, bio, created_at, updated_at)
                VALUES(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                user.id(), user.name(), user.email(), user.role(), user.department(), user.bio()
        );
    }

    public void upsertSession(String tokenId, String userId, Instant issuedAt, Instant expiresAt) {
        int updated = jdbcTemplate.update(
                """
                UPDATE auth_sessions
                SET user_id = ?, issued_at = ?, expires_at = ?, revoked = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE token_id = ?
                """,
                userId,
                Timestamp.from(issuedAt),
                Timestamp.from(expiresAt),
                tokenId
        );
        if (updated > 0) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO auth_sessions(token_id, user_id, issued_at, expires_at, revoked, created_at, updated_at)
                VALUES(?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                tokenId,
                userId,
                Timestamp.from(issuedAt),
                Timestamp.from(expiresAt)
        );
    }

    public Optional<SessionRecord> findActiveSession(String tokenId) {
        List<SessionRecord> rows = jdbcTemplate.query(
                """
                SELECT token_id, user_id, issued_at, expires_at, revoked
                FROM auth_sessions
                WHERE token_id = ?
                """,
                (rs, rowNum) -> new SessionRecord(
                        rs.getString("token_id"),
                        rs.getString("user_id"),
                        rs.getTimestamp("issued_at").toInstant(),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getBoolean("revoked")
                ),
                tokenId
        );
        return rows.stream()
                .filter(row -> !row.revoked())
                .findFirst();
    }

    public void revokeSession(String tokenId) {
        jdbcTemplate.update(
                """
                UPDATE auth_sessions
                SET revoked = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE token_id = ?
                """,
                tokenId
        );
    }

    public record SessionRecord(
            String tokenId,
            String userId,
            Instant issuedAt,
            Instant expiresAt,
            boolean revoked
    ) {}
}
