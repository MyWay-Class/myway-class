package com.myway.backendspring.feature.understanding;

public interface InputUnderstandingService {
    UnderstandingResult understand(UnderstandingContext context);

    UnderstandingResult understandTranscript(String lectureId, String transcriptText, java.util.Map<String, Object> metadata);

    UnderstandingResult understandMessage(String userId, String message, String lectureId, String courseId);
}
