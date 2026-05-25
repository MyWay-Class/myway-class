package com.myway.backendspring.api.support;

import java.util.Set;

public final class MediaCallbackPolicy {
    private static final Set<String> ALLOWED_CALLBACK_STATUSES = Set.of("COMPLETED", "FAILED", "PROCESSING");
    private static final Set<String> ALLOWED_SYNC_MODES = Set.of("AUTO", "APPROVAL");
    private static final Set<String> ALLOWED_OVERWRITE_POLICIES = Set.of("OVERWRITE", "SKIP_IF_EXISTS");
    private static final Set<String> ALLOWED_APPROVAL_STATES = Set.of("APPROVED", "PENDING");

    private MediaCallbackPolicy() {}

    public record CallbackPolicyDecision(boolean valid, String status, long eventVersion, String errorMessage) {
        public static CallbackPolicyDecision valid(String status, long eventVersion) {
            return new CallbackPolicyDecision(true, status, eventVersion, null);
        }

        public static CallbackPolicyDecision invalid(String errorMessage) {
            return new CallbackPolicyDecision(false, null, 0L, errorMessage);
        }
    }

    public record SttSyncPolicyDecision(
            boolean valid,
            String syncMode,
            String overwritePolicy,
            String approvalState,
            String notificationChannel,
            String errorMessage
    ) {
        public static SttSyncPolicyDecision valid(String syncMode, String overwritePolicy, String approvalState, String notificationChannel) {
            return new SttSyncPolicyDecision(true, syncMode, overwritePolicy, approvalState, notificationChannel, null);
        }

        public static SttSyncPolicyDecision invalid(String errorMessage) {
            return new SttSyncPolicyDecision(false, null, null, null, null, errorMessage);
        }
    }

    public static CallbackPolicyDecision decideCallback(Long eventVersion, String status) {
        long resolvedEventVersion = eventVersion != null ? eventVersion : 1L;
        if (resolvedEventVersion < 1L) {
            return CallbackPolicyDecision.invalid("event_version은 1 이상이어야 합니다.");
        }
        String resolvedStatus = status == null ? "COMPLETED" : status.trim().toUpperCase();
        if (!ALLOWED_CALLBACK_STATUSES.contains(resolvedStatus)) {
            return CallbackPolicyDecision.invalid("status는 COMPLETED, FAILED, PROCESSING 중 하나여야 합니다.");
        }
        return CallbackPolicyDecision.valid(resolvedStatus, resolvedEventVersion);
    }

    public static SttSyncPolicyDecision decideSttSync(String syncMode, String overwritePolicy, String approvalState, String notificationChannel) {
        String resolvedSyncMode = syncMode == null ? "AUTO" : syncMode.trim().toUpperCase();
        String resolvedOverwritePolicy = overwritePolicy == null ? "OVERWRITE" : overwritePolicy.trim().toUpperCase();
        String resolvedApprovalState = approvalState == null ? "PENDING" : approvalState.trim().toUpperCase();
        String resolvedChannel = notificationChannel == null ? "dashboard" : notificationChannel.trim();

        if (!ALLOWED_SYNC_MODES.contains(resolvedSyncMode)) {
            return SttSyncPolicyDecision.invalid("sync_mode는 auto 또는 approval 이어야 합니다.");
        }
        if (!ALLOWED_OVERWRITE_POLICIES.contains(resolvedOverwritePolicy)) {
            return SttSyncPolicyDecision.invalid("overwrite_policy는 overwrite 또는 skip_if_exists 이어야 합니다.");
        }
        if (!ALLOWED_APPROVAL_STATES.contains(resolvedApprovalState)) {
            return SttSyncPolicyDecision.invalid("approval_state는 approved 또는 pending 이어야 합니다.");
        }
        return SttSyncPolicyDecision.valid(
                resolvedSyncMode,
                resolvedOverwritePolicy,
                resolvedApprovalState,
                resolvedChannel.isBlank() ? "dashboard" : resolvedChannel
        );
    }
}
