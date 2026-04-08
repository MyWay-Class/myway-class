import { demoAIIntentLogs, demoAIQuestionLogs, demoAIUsageLogs, demoCourses, demoEnrollments, demoLectures, demoUsers, getDemoUser } from '../data/demo-data';
import type {
  AIAdminInsight,
  AIInsightFeatureStat,
  AIInsightIntentStat,
  AIInsightSummary,
  AIInsights,
  AIInstructorInsight,
  AIInstructorLectureInsight,
  AIStudentInsight,
  AIIntentLog,
  AIQuestionLog,
  AIUsageLog,
  UserRole,
} from '../types';

const RECENT_WINDOW_DAYS = 7;

function formatLabel(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((successCount / totalCount) * 100);
}

function buildFeatureStats(logs: AIUsageLog[]): AIInsightFeatureStat[] {
  const grouped = new Map<
    string,
    {
      count: number;
      successCount: number;
      latencyTotal: number;
    }
  >();

  for (const log of logs) {
    const current = grouped.get(log.feature) ?? { count: 0, successCount: 0, latencyTotal: 0 };
    current.count += 1;
    current.successCount += log.success;
    current.latencyTotal += log.latency_ms;
    grouped.set(log.feature, current);
  }

  const stats = [...grouped.entries()].map(([feature, data]) => ({
    feature,
    label: formatLabel(feature),
    count: data.count,
    success_rate: getSuccessRate(data.successCount, data.count),
    avg_latency_ms: Math.round(data.latencyTotal / data.count),
  }));
  stats.sort((a, b) => b.count - a.count);
  return stats;
}

function buildIntentStats(logs: AIIntentLog[]): AIInsightIntentStat[] {
  const grouped = new Map<
    string,
    {
      count: number;
      successCount: number;
      confidenceTotal: number;
    }
  >();

  for (const log of logs) {
    const current = grouped.get(log.detected_intent) ?? { count: 0, successCount: 0, confidenceTotal: 0 };
    current.count += 1;
    current.successCount += log.success ? 1 : 0;
    current.confidenceTotal += log.confidence;
    grouped.set(log.detected_intent, current);
  }

  const stats = [...grouped.entries()].map(([intent, data]) => ({
    intent: intent as AIIntentLog['detected_intent'],
    label: formatLabel(intent),
    count: data.count,
    success_rate: getSuccessRate(data.successCount, data.count),
    avg_confidence: Math.round((data.confidenceTotal / data.count) * 100),
  }));
  stats.sort((a, b) => b.count - a.count);
  return stats;
}

function buildSummary(usageLogs: AIUsageLog[]): AIInsightSummary {
  const totalRequests = usageLogs.length;
  const successCount = usageLogs.filter((log) => log.success === 1).length;
  const latencyTotal = usageLogs.reduce((sum, log) => sum + log.latency_ms, 0);
  const uniqueUsers = new Set(usageLogs.map((log) => log.user_id).filter(Boolean)).size;

  return {
    total_requests: totalRequests,
    success_rate: getSuccessRate(successCount, totalRequests),
    avg_latency_ms: totalRequests === 0 ? 0 : Math.round(latencyTotal / totalRequests),
    unique_users: uniqueUsers,
    recent_window_days: RECENT_WINDOW_DAYS,
  };
}

function buildStudentInsight(usageLogs: AIUsageLog[], intentLogs: AIIntentLog[]): AIStudentInsight {
  const recentIntents = buildIntentStats(intentLogs).slice(0, 4);
  const featureStats = buildFeatureStats(usageLogs).slice(0, 4);

  const recommendedActions = [
    '스마트 채팅으로 학습 질문을 이어가 보세요.',
    '요약 기능으로 강의 핵심을 먼저 정리해 보세요.',
    '퀴즈 기능으로 복습 범위를 점검해 보세요.',
  ];

  return {
    role: 'STUDENT',
    total_requests: usageLogs.length,
    recent_intents: recentIntents,
    feature_stats: featureStats,
    recommended_actions: recommendedActions,
  };
}

function buildInstructorInsight(
  userId: string,
  usageLogs: AIUsageLog[],
  intentLogs: AIIntentLog[],
  questionLogs: AIQuestionLog[],
): AIInstructorInsight {
  const instructorCourses = demoCourses.filter((course) => course.instructor_id === userId);
  const instructorLectureIds = new Set(
    demoLectures.filter((lecture) => instructorCourses.some((course) => course.id === lecture.course_id)).map((lecture) => lecture.id),
  );
  const relevantQuestions = questionLogs.filter((question) => instructorLectureIds.has(question.lecture_id));
  const lectureMap = new Map(demoLectures.map((lecture) => [lecture.id, lecture.title]));
  const lectureCounts = new Map<string, number>();

  for (const question of relevantQuestions) {
    lectureCounts.set(question.lecture_id, (lectureCounts.get(question.lecture_id) ?? 0) + 1);
  }

  const topLectureQuestions: AIInstructorLectureInsight[] = [...lectureCounts.entries()].map(([lectureId, count]) => ({
    lecture_id: lectureId,
    lecture_title: lectureMap.get(lectureId) ?? '알 수 없는 강의',
    question_count: count,
  }));
  topLectureQuestions.sort((a, b) => b.question_count - a.question_count);

  return {
    role: 'INSTRUCTOR',
    total_questions: relevantQuestions.length,
    top_lecture_questions: topLectureQuestions,
    feature_stats: buildFeatureStats(usageLogs),
    intent_stats: buildIntentStats(intentLogs),
  };
}

function buildAdminInsight(usageLogs: AIUsageLog[], intentLogs: AIIntentLog[]): AIAdminInsight {
  return {
    role: 'ADMIN',
    total_users: demoUsers.length,
    published_courses: demoCourses.filter((course) => course.is_published).length,
    total_enrollments: demoEnrollments.length,
    ai_usage_7d: usageLogs.length,
    feature_stats: buildFeatureStats(usageLogs),
    intent_stats: buildIntentStats(intentLogs),
  };
}

export function getAIInsightsForUser(userId: string): AIInsights {
  const user = getDemoUser(userId);
  const role: UserRole = user?.role ?? 'STUDENT';
  const usageLogs = demoAIUsageLogs.filter((log) => log.user_id === userId || role === 'ADMIN');
  const intentLogs = demoAIIntentLogs.filter((log) => log.user_id === userId || role === 'ADMIN');
  const questionLogs = demoAIQuestionLogs.filter((log) => log.user_id === userId || role === 'ADMIN');
  const summary = buildSummary(usageLogs);

  if (role === 'INSTRUCTOR') {
    return {
      role,
      summary,
      feature_stats: buildFeatureStats(usageLogs),
      intent_stats: buildIntentStats(intentLogs),
      role_insight: buildInstructorInsight(userId, usageLogs, intentLogs, questionLogs),
    };
  }

  if (role === 'ADMIN') {
    return {
      role,
      summary,
      feature_stats: buildFeatureStats(usageLogs),
      intent_stats: buildIntentStats(intentLogs),
      role_insight: buildAdminInsight(usageLogs, intentLogs),
    };
  }

  return {
    role: 'STUDENT',
    summary,
    feature_stats: buildFeatureStats(usageLogs),
    intent_stats: buildIntentStats(intentLogs),
    role_insight: buildStudentInsight(usageLogs, intentLogs),
  };
}
