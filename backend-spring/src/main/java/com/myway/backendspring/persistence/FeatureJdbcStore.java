package com.myway.backendspring.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class FeatureJdbcStore {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private volatile Boolean postgres;

    public FeatureJdbcStore(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void upsertKv(String scope, String id, Map<String, Object> payload) {
        String json = toJson(payload);
        if (isPostgres()) {
            jdbcTemplate.update(
                    """
                    INSERT INTO kv_store(scope, id, payload, updated_at)
                    VALUES(?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT (scope, id)
                    DO UPDATE SET payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP
                    """,
                    scope, id, json
            );
            return;
        }
        jdbcTemplate.update(
                """
                MERGE INTO kv_store(scope, id, payload, updated_at)
                KEY(scope, id)
                VALUES(?, ?, ?, CURRENT_TIMESTAMP)
                """,
                scope, id, json
        );
    }

    public Map<String, Object> getKv(String scope, String id) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT payload FROM kv_store WHERE scope = ? AND id = ?",
                    (rs, rowNum) -> fromJsonMap(rs.getString("payload")),
                    scope, id
            );
        } catch (DataAccessException ex) {
            return null;
        }
    }

    public List<Map<String, Object>> listKvByScope(String scope) {
        return jdbcTemplate.query(
                "SELECT payload FROM kv_store WHERE scope = ? ORDER BY updated_at DESC",
                (rs, rowNum) -> fromJsonMap(rs.getString("payload")),
                scope
        );
    }

    public void insertEvent(String scope, String ownerId, String id, Map<String, Object> payload) {
        jdbcTemplate.update(
                "INSERT INTO scoped_events(scope, owner_id, id, payload, created_at) VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP)",
                scope, ownerId, id, toJson(payload)
        );
    }

    public List<Map<String, Object>> listEventsByOwner(String scope, String ownerId) {
        return jdbcTemplate.query(
                "SELECT payload FROM scoped_events WHERE scope = ? AND owner_id = ? ORDER BY created_at DESC",
                (rs, rowNum) -> fromJsonMap(rs.getString("payload")),
                scope, ownerId
        );
    }

    public List<Map<String, Object>> listEventsByScope(String scope) {
        return jdbcTemplate.query(
                "SELECT payload FROM scoped_events WHERE scope = ? ORDER BY created_at DESC",
                (rs, rowNum) -> fromJsonMap(rs.getString("payload")),
                scope
        );
    }

    public int getAiUsageDailyCount(String userId, LocalDate day) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT usage_count FROM ai_usage_daily WHERE user_id = ? AND usage_day = ?",
                    Integer.class,
                    userId, day
            );
            return count == null ? 0 : count;
        } catch (DataAccessException ex) {
            return 0;
        }
    }

    public void upsertAiUsageDaily(String userId, LocalDate day, int count) {
        if (isPostgres()) {
            jdbcTemplate.update(
                    """
                    INSERT INTO ai_usage_daily(user_id, usage_day, usage_count, updated_at)
                    VALUES(?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id, usage_day)
                    DO UPDATE SET usage_count = EXCLUDED.usage_count, updated_at = CURRENT_TIMESTAMP
                    """,
                    userId, day, count
            );
            return;
        }
        jdbcTemplate.update(
                """
                MERGE INTO ai_usage_daily(user_id, usage_day, usage_count, updated_at)
                KEY(user_id, usage_day)
                VALUES(?, ?, ?, CURRENT_TIMESTAMP)
                """,
                userId, day, count
        );
    }

    public void insertAiUsageLog(String id, String userId, String feature, boolean success, String inputText) {
        jdbcTemplate.update(
                "INSERT INTO ai_usage_log(id, user_id, feature, success, input_text, created_at) VALUES(?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                id, userId, feature, success, inputText
        );
    }

    public List<Map<String, Object>> listAiUsageLogs(String userId) {
        return jdbcTemplate.query(
                "SELECT id, user_id, feature, success, input_text, created_at FROM ai_usage_log WHERE user_id = ? ORDER BY created_at DESC",
                (rs, rowNum) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", rs.getString("id"));
                    row.put("user_id", rs.getString("user_id"));
                    row.put("feature", rs.getString("feature"));
                    row.put("success", rs.getBoolean("success"));
                    row.put("input_text", rs.getString("input_text"));
                    row.put("created_at", rs.getTimestamp("created_at").toInstant().toString());
                    return row;
                },
                userId
        );
    }

    public void insertActivityEvent(
            String id,
            String userId,
            String type,
            String resourceType,
            String resourceId,
            Map<String, Object> metadata
    ) {
        jdbcTemplate.update(
                "INSERT INTO activity_event(id, user_id, type, resource_type, resource_id, metadata, occurred_at) VALUES(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                id, userId, type, resourceType, resourceId, metadata == null ? null : toJson(metadata)
        );
    }

    public List<Map<String, Object>> listActivityEvents(String userId, int limit) {
        return listActivityEvents(userId, null, null, null, limit);
    }

    public List<Map<String, Object>> listActivityEvents(
            String userId,
            String type,
            String occurredFromIso,
            String occurredToIso,
            int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        OffsetDateTime occurredFrom = parseIsoDateTimeOrNull(occurredFromIso);
        OffsetDateTime occurredTo = parseIsoDateTimeOrNull(occurredToIso);
        String safeType = (type == null || type.isBlank()) ? null : type.trim();
        List<Object> args = new ArrayList<>();
        StringBuilder sql = new StringBuilder("""
                SELECT id, user_id, type, resource_type, resource_id, metadata, occurred_at
                FROM activity_event
                WHERE user_id = ?
                """);
        args.add(userId);
        if (safeType != null) {
            sql.append(" AND type = ?");
            args.add(safeType);
        }
        if (occurredFrom != null) {
            sql.append(" AND occurred_at >= ?");
            args.add(Timestamp.from(occurredFrom.toInstant()));
        }
        if (occurredTo != null) {
            sql.append(" AND occurred_at <= ?");
            args.add(Timestamp.from(occurredTo.toInstant()));
        }
        sql.append(" ORDER BY occurred_at DESC LIMIT ?");
        args.add(safeLimit);
        return jdbcTemplate.query(
                sql.toString(),
                (rs, rowNum) -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", rs.getString("id"));
                    row.put("user_id", rs.getString("user_id"));
                    row.put("type", rs.getString("type"));
                    row.put("resource_type", rs.getString("resource_type"));
                    row.put("resource_id", rs.getString("resource_id"));
                    String metadata = rs.getString("metadata");
                    row.put("metadata", metadata == null || metadata.isBlank() ? Collections.emptyMap() : fromJsonMap(metadata));
                    row.put("occurred_at", rs.getTimestamp("occurred_at").toInstant().toString());
                    return row;
                },
                args.toArray()
        );
    }

    private OffsetDateTime parseIsoDateTimeOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return OffsetDateTime.parse(value);
    }

    private boolean isPostgres() {
        if (postgres != null) {
            return postgres;
        }
        Boolean detected = jdbcTemplate.execute((Connection connection) ->
                connection.getMetaData().getDatabaseProductName().toLowerCase().contains("postgres"));
        postgres = detected != null && detected;
        return postgres;
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new IllegalStateException("failed to serialize payload", e);
        }
    }

    private Map<String, Object> fromJsonMap(String payload) {
        try {
            Map<String, Object> parsed = objectMapper.readValue(payload, MAP_TYPE);
            return parsed != null ? parsed : Collections.emptyMap();
        } catch (Exception e) {
            throw new IllegalStateException("failed to deserialize payload", e);
        }
    }
}
