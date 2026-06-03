package com.myway.backendspring.feature.understanding;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DefaultUnderstandingPromptService implements UnderstandingPromptService {
    @Override
    public String buildEntityPrompt(UnderstandingContext context) {
        return """
                다음 입력에서 교육 도메인 엔티티를 추출하세요.
                - lecture_id, course_id, topic, speaker_label, time_range, action_target
                - JSON 배열만 반환하세요.
                입력: %s
                """.formatted(context.normalizedText());
    }

    @Override
    public String buildIntentPrompt(UnderstandingContext context, List<Map<String, Object>> entities) {
        return """
                다음 입력의 intent를 하나만 선택하세요.
                선택지: search, answer, summary, quiz, recommendation, lecture_followup, unknown
                입력: %s
                lecture_id: %s
                course_id: %s
                entities: %s
                """.formatted(context.normalizedText(), context.lectureId(), context.courseId(), entities);
    }
}
