package com.myway.backendspring.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Repository
public class FeatureJdbcStore {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public FeatureJdbcStore(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void upsertKv(String scope, String id, Map<String, Object> payload) {
        String json = toJson(payload);
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
