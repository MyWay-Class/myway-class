package com.myway.backendspring.domain;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class LearningProgressCalculator {
    public int progressPercent(List<LectureItem> lectures, Set<String> completedLectureIds) {
        int total = lectures == null ? 0 : lectures.size();
        if (total == 0) {
            return 0;
        }
        long completed = lectures.stream()
                .filter(lecture -> completedLectureIds.contains(lecture.id()))
                .count();
        return (int) Math.round((completed * 100.0) / total);
    }

    public Map<String, Object> completionSummary(String lectureId, String courseId, List<LectureItem> lectures, Set<String> completedLectureIds) {
        long completed = lectures.stream()
                .filter(lecture -> completedLectureIds.contains(lecture.id()))
                .count();
        int total = lectures.size();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
        return Map.of(
                "lecture_id", lectureId,
                "course_id", courseId,
                "progress_percent", progress,
                "completed_lectures", completed,
                "total_lectures", total
        );
    }
}
