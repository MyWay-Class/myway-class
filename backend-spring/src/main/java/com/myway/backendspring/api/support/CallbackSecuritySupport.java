package com.myway.backendspring.api.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myway.backendspring.feature.repository.FeatureStoreRepository;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.HexFormat;

@Component
public class CallbackSecuritySupport {
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(5);

    private final ObjectMapper objectMapper;

    public CallbackSecuritySupport(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record CallbackDecision(boolean signed, boolean valid, String errorCode, String errorMessage) {
        public static CallbackDecision legacy() {
            return new CallbackDecision(false, true, null, null);
        }

        public static CallbackDecision ok() {
            return new CallbackDecision(true, true, null, null);
        }

        public static CallbackDecision invalid(String errorCode, String errorMessage) {
            return new CallbackDecision(true, false, errorCode, errorMessage);
        }
    }

    public CallbackDecision verifyMediaCallback(
            FeatureStoreRepository repository,
            String scope,
            String secret,
            String issuedAt,
            String nonce,
            String signature,
            Map<String, Object> payload,
            long ttlSeconds
    ) {
        return verifySignedCallback(repository, scope, secret, issuedAt, nonce, signature, payload, ttlSeconds, mediaPayloadOrder());
    }

    public CallbackDecision verifyShortformCallback(
            FeatureStoreRepository repository,
            String scope,
            String secret,
            String issuedAt,
            String nonce,
            String signature,
            Map<String, Object> payload,
            long ttlSeconds
    ) {
        return verifySignedCallback(repository, scope, secret, issuedAt, nonce, signature, payload, ttlSeconds, shortformPayloadOrder());
    }

    public String signMediaCallback(String secret, String scope, String issuedAt, String nonce, Map<String, Object> payload) {
        return sign(secret, canonicalEnvelope(scope, issuedAt, nonce, payload, mediaPayloadOrder()));
    }

    public String signShortformCallback(String secret, String scope, String issuedAt, String nonce, Map<String, Object> payload) {
        return sign(secret, canonicalEnvelope(scope, issuedAt, nonce, payload, shortformPayloadOrder()));
    }

    private CallbackDecision verifySignedCallback(
            FeatureStoreRepository repository,
            String scope,
            String secret,
            String issuedAt,
            String nonce,
            String signature,
            Map<String, Object> payload,
            long ttlSeconds,
            List<String> orderedKeys
    ) {
        boolean anySignedFieldPresent = hasText(issuedAt) || hasText(nonce) || hasText(signature);
        if (!anySignedFieldPresent) {
            return CallbackDecision.legacy();
        }

        if (!hasText(issuedAt) || !hasText(nonce) || !hasText(signature)) {
            return CallbackDecision.invalid("INVALID_SIGNATURE", "signed callback에는 issued_at, nonce, signature가 모두 필요합니다.");
        }

        if (!hasText(secret)) {
            return CallbackDecision.invalid("INVALID_SIGNATURE", "callback secret이 필요합니다.");
        }

        Instant issuedInstant;
        try {
            issuedInstant = Instant.parse(issuedAt.trim());
        } catch (Exception exception) {
            return CallbackDecision.invalid("INVALID_SIGNATURE", "issued_at 형식이 올바르지 않습니다.");
        }

        Instant now = Instant.now();
        long ttl = ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL.toSeconds();
        if (issuedInstant.isAfter(now.plusSeconds(30)) || Duration.between(issuedInstant, now).getSeconds() > ttl) {
            return CallbackDecision.invalid("CALLBACK_EXPIRED", "callback ttl이 만료되었습니다.");
        }

        String canonical = canonicalEnvelope(scope, issuedAt.trim(), nonce.trim(), payload, orderedKeys);
        String expected = sign(secret, canonical);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.trim().getBytes(StandardCharsets.UTF_8))) {
            return CallbackDecision.invalid("INVALID_SIGNATURE", "callback signature가 일치하지 않습니다.");
        }

        Instant expiresAt = issuedInstant.plusSeconds(ttl);
        boolean claimed = repository.claimCallbackNonce(scope, nonce.trim(), expiresAt);
        if (!claimed) {
            return CallbackDecision.invalid("REPLAY_DETECTED", "이미 처리된 callback nonce입니다.");
        }

        return CallbackDecision.ok();
    }

    private String canonicalEnvelope(String scope, String issuedAt, String nonce, Map<String, Object> payload, List<String> orderedKeys) {
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("scope", scope);
        envelope.put("issued_at", issuedAt);
        envelope.put("nonce", nonce);
        for (String key : orderedKeys) {
            envelope.put(key, payload.get(key));
        }
        try {
            return objectMapper.writeValueAsString(envelope);
        } catch (Exception exception) {
            throw new IllegalStateException("callback payload를 직렬화할 수 없습니다.", exception);
        }
    }

    private String sign(String secret, String canonical) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("callback signature를 생성할 수 없습니다.", exception);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isBlank();
    }

    private List<String> mediaPayloadOrder() {
        return List.of(
                "extraction_id",
                "lecture_id",
                "status",
                "event_version",
                "error_message",
                "audio_url",
                "processing_job_id",
                "processing_stage",
                "processing_step",
                "audio_format",
                "sample_rate",
                "channels",
                "sync_mode",
                "overwrite_policy",
                "approval_state",
                "notification_channel"
        );
    }

    private List<String> shortformPayloadOrder() {
        return List.of(
                "shortform_id",
                "video_id",
                "status",
                "event_version",
                "video_url",
                "error_message",
                "failure_reason",
                "processing_job_id",
                "processing_stage",
                "processing_step"
        );
    }
}
