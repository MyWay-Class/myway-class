package com.myway.backendspring.api.support;

import com.myway.backendspring.auth.SessionView;
import com.myway.backendspring.common.ApiResponse;
import com.myway.backendspring.feature.media.MediaPipelineService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;

import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

@Component
public class MediaControllerAssetSupport {
    public ResponseEntity<?> handleAssets(
            String auth,
            String processorToken,
            String queryToken,
            HttpServletRequest request,
            String callbackToken,
            Function<String, SessionView> sessionResolver,
            Supplier<ResponseEntity<?>> unauthenticatedSupplier,
            MediaAssetPlaybackSupport playbackSupport,
            MediaPipelineService mediaPipelineService
    ) {
        String assetKey = extractAssetKey(request);
        if (assetKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.failure("ASSET_NOT_FOUND", "미디어 파일을 찾을 수 없습니다."));
        }

        String resolvedQueryToken = playbackSupport.resolveQueryToken(queryToken, request);
        String resolvedAuth = resolveAuth(auth, resolvedQueryToken);
        boolean playbackMode = playbackSupport.isPlaybackRequest(request, resolvedQueryToken);
        boolean processorBypass = processorToken != null && processorToken.equals(callbackToken);

        if (!processorBypass) {
            SessionView session = sessionResolver.apply(resolvedAuth);
            if (session == null) {
                if (playbackMode) {
                    return playbackSupport.playbackFailure(
                            HttpStatus.UNAUTHORIZED,
                            "MEDIA_PLAYBACK_TOKEN_INVALID",
                            "유효한 재생 토큰이 필요합니다."
                    );
                }
                return unauthenticatedSupplier.get();
            }
        }

        ResponseEntity<?> proxied = playbackSupport.proxyRemoteAsset(assetKey);
        if (playbackMode && proxied != null) return proxied;

        Map<String, Object> asset = mediaPipelineService.mediaAsset(assetKey);
        if (asset != null) {
            if (playbackMode) {
                ResponseEntity<?> localPlayback = playbackSupport.fallbackLocalPlaybackAsset(assetKey);
                if (localPlayback != null) return localPlayback;
                return playbackSupport.playbackFailure(
                        HttpStatus.BAD_GATEWAY,
                        "MEDIA_PLAYBACK_SOURCE_UNAVAILABLE",
                        "재생 가능한 원본 영상을 찾을 수 없습니다."
                );
            }
            return ResponseEntity.ok(ApiResponse.success(asset));
        }

        if (playbackMode) {
            return playbackSupport.playbackFailure(
                    HttpStatus.BAD_GATEWAY,
                    "MEDIA_ASSET_PROXY_UNAVAILABLE",
                    "영상 원본 서버에 연결할 수 없습니다."
            );
        }
        if (proxied != null) return proxied;
        return playbackSupport.assetNotFound();
    }

    private String resolveAuth(String auth, String resolvedQueryToken) {
        if ((auth == null || auth.isBlank()) && resolvedQueryToken != null && !resolvedQueryToken.isBlank()) {
            return "Bearer " + resolvedQueryToken;
        }
        return auth;
    }

    private String extractAssetKey(HttpServletRequest request) {
        String path = String.valueOf(request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE));
        String prefix = "/api/v1/media/assets/";
        return path.startsWith(prefix) ? path.substring(prefix.length()) : "";
    }
}
