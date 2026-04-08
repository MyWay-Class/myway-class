import { demoCourses, demoEnrollments, getDemoUser } from '../data/demo-data';
import { getCourseProgress, getLectureInstructorName, listCourseCards } from '../lms/learning';
import type {
  AIRecommendationCard,
  AIRecommendationMode,
  AIRecommendationOverview,
  AIRecommendationSource,
  AIThemePreference,
  AIUserSettings,
  AIUserSettingsUpdateRequest,
  Course,
  UserRole,
} from '../types';

const DEFAULT_SETTINGS: Record<UserRole, Omit<AIUserSettings, 'user_id' | 'updated_at'>> = {
  STUDENT: {
    language: 'ko',
    theme: 'system',
    auto_summary: true,
    recommendation_mode: 'progress',
  },
  INSTRUCTOR: {
    language: 'ko',
    theme: 'system',
    auto_summary: false,
    recommendation_mode: 'balanced',
  },
  ADMIN: {
    language: 'ko',
    theme: 'system',
    auto_summary: false,
    recommendation_mode: 'balanced',
  },
};

const storedSettings = new Map<string, AIUserSettings>();

function nowIso(): string {
  return new Date().toISOString();
}

function getUserRole(userId: string): UserRole {
  return getDemoUser(userId)?.role ?? 'STUDENT';
}

function getDefaultSettings(userId: string): AIUserSettings {
  const role = getUserRole(userId);
  return {
    user_id: userId,
    updated_at: nowIso(),
    ...DEFAULT_SETTINGS[role],
  };
}

export function getAIUserSettings(userId: string): AIUserSettings {
  const existing = storedSettings.get(userId);
  if (existing) {
    return existing;
  }

  const defaults = getDefaultSettings(userId);
  storedSettings.set(userId, defaults);
  return defaults;
}

function isAIThemePreference(value: unknown): value is AIThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isAIRecommendationMode(value: unknown): value is AIRecommendationMode {
  return value === 'progress' || value === 'discovery' || value === 'balanced';
}

export function updateAIUserSettings(userId: string, input: AIUserSettingsUpdateRequest): AIUserSettings {
  const current = getAIUserSettings(userId);
  const next: AIUserSettings = {
    ...current,
    ...(typeof input.language === 'string' ? { language: input.language } : {}),
    ...(isAIThemePreference(input.theme) ? { theme: input.theme } : {}),
    ...(typeof input.auto_summary === 'boolean' ? { auto_summary: input.auto_summary } : {}),
    ...(isAIRecommendationMode(input.recommendation_mode)
      ? { recommendation_mode: input.recommendation_mode }
      : {}),
    updated_at: nowIso(),
  };

  storedSettings.set(userId, next);
  return next;
}

function createRecommendationCard(
  course: Course,
  input: {
    source: AIRecommendationSource;
    reason: string;
    score: number;
    progress_percent: number;
    is_enrolled: boolean;
  },
): AIRecommendationCard {
  return {
    id: `${input.source}:${course.id}`,
    course_id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    instructor_name: getLectureInstructorName(course.instructor_id),
    progress_percent: input.progress_percent,
    reason: input.reason,
    score: input.score,
    is_enrolled: input.is_enrolled,
    source: input.source,
    tags: course.tags,
  };
}

function getCourseAggregateProgress(courseId: string): number {
  const enrollments = demoEnrollments.filter((enrollment) => enrollment.course_id === courseId && enrollment.status === 'active');
  if (enrollments.length === 0) {
    return 0;
  }

  return Math.round(
    enrollments.reduce((sum, enrollment) => sum + enrollment.progress_percent, 0) / enrollments.length,
  );
}

function getRelatedCourseScore(course: Course, seedCourses: Course[]): number {
  const seedTags = new Set(seedCourses.flatMap((item) => item.tags));
  const sharedTagCount = course.tags.filter((tag) => seedTags.has(tag)).length;
  const sameCategory = seedCourses.some((item) => item.category === course.category) ? 2 : 0;
  const difficultyScore = course.difficulty === 'beginner' ? 3 : course.difficulty === 'intermediate' ? 2 : 1;
  return sharedTagCount * 4 + sameCategory + difficultyScore;
}

function sortRecommendations(
  items: AIRecommendationCard[],
  mode: AIRecommendationMode,
): AIRecommendationCard[] {
  const progressFirst = [...items].sort((left, right) => left.progress_percent - right.progress_percent || right.score - left.score);
  const discoveryFirst = [...items].sort((left, right) => right.score - left.score || left.progress_percent - right.progress_percent);

  if (mode === 'discovery') {
    return discoveryFirst;
  }

  if (mode === 'balanced') {
    const result: AIRecommendationCard[] = [];
    const maxLength = Math.max(progressFirst.length, discoveryFirst.length);
    for (let index = 0; index < maxLength; index += 1) {
      if (progressFirst[index] && !result.some((item) => item.id === progressFirst[index].id)) {
        result.push(progressFirst[index]);
      }
      if (discoveryFirst[index] && !result.some((item) => item.id === discoveryFirst[index].id)) {
        result.push(discoveryFirst[index]);
      }
    }
    return result;
  }

  return progressFirst;
}

function buildStudentRecommendations(userId: string, settings: AIUserSettings): AIRecommendationCard[] {
  const courseCards = listCourseCards(userId);
  const active = courseCards.filter((course) => course.enrolled);
  const enrolledIds = new Set(active.map((course) => course.id));
  const enrolledCourses = demoCourses.filter((course) => enrolledIds.has(course.id));

  const progressItems = active
    .sort((left, right) => left.progress_percent - right.progress_percent || left.title.localeCompare(right.title))
    .map((course) =>
      createRecommendationCard(
        demoCourses.find((item) => item.id === course.id)!,
        {
          source: 'progress',
          reason: `진행률 ${course.progress_percent}%라 다시 보기와 복습에 적합합니다.`,
          score: 100 - course.progress_percent,
          progress_percent: course.progress_percent,
          is_enrolled: true,
        },
      ),
    );

  const discoveryCandidates = demoCourses
    .filter((course) => !enrolledIds.has(course.id))
    .map((course) => ({
      course,
      score: getRelatedCourseScore(course, enrolledCourses),
    }))
    .sort((left, right) => right.score - left.score || left.course.title.localeCompare(right.course.title));

  const discoveryItems = discoveryCandidates.slice(0, 3).map(({ course, score }) =>
    createRecommendationCard(course, {
      source: 'discovery',
      reason: enrolledCourses.length > 0
        ? `수강 중인 과목과 태그가 겹쳐 이어서 보기 좋습니다.`
        : '입문 과정부터 시작하기 좋은 추천 과목입니다.',
      score,
      progress_percent: getCourseProgress(userId, course.id),
      is_enrolled: false,
    }),
  );

  return sortRecommendations([...progressItems, ...discoveryItems], settings.recommendation_mode).slice(0, 4);
}

function buildInstructorRecommendations(userId: string, settings: AIUserSettings): AIRecommendationCard[] {
  const ownedCourses = demoCourses.filter((course) => course.instructor_id === userId);
  const ownedItems = ownedCourses
    .map((course) => {
      const progress = getCourseAggregateProgress(course.id);
      return createRecommendationCard(course, {
        source: 'review',
        reason: `수강생 평균 진행률이 ${progress}%입니다. 보강 자료나 공지를 점검하기 좋습니다.`,
        score: 100 - progress,
        progress_percent: progress,
        is_enrolled: false,
      });
    })
    .sort((left, right) => left.progress_percent - right.progress_percent || right.score - left.score);

  const relatedCandidates = demoCourses
    .filter((course) => course.instructor_id !== userId)
    .map((course) => ({
      course,
      score: getRelatedCourseScore(course, ownedCourses),
    }))
    .sort((left, right) => right.score - left.score || left.course.title.localeCompare(right.course.title))
    .slice(0, 2)
    .map(({ course, score }) =>
      createRecommendationCard(course, {
        source: 'discovery',
        reason: '인접 과목을 비교하면 강의 흐름과 난이도 배치를 점검하는 데 도움이 됩니다.',
        score,
        progress_percent: getCourseAggregateProgress(course.id),
        is_enrolled: false,
      }),
    );

  return sortRecommendations([...ownedItems, ...relatedCandidates], settings.recommendation_mode).slice(0, 4);
}

function buildAdminRecommendations(settings: AIUserSettings): AIRecommendationCard[] {
  const reviewedCourses = demoCourses
    .map((course) => ({
      course,
      progress: getCourseAggregateProgress(course.id),
    }))
    .sort((left, right) => left.progress - right.progress || right.course.title.localeCompare(left.course.title));

  const items = reviewedCourses.slice(0, 4).map(({ course, progress }) =>
    createRecommendationCard(course, {
      source: 'management',
      reason: `전체 수강생 평균 진행률이 ${progress}%입니다. 운영 점검 대상으로 적합합니다.`,
      score: 100 - progress,
      progress_percent: progress,
      is_enrolled: false,
    }),
  );

  return sortRecommendations(items, settings.recommendation_mode).slice(0, 4);
}

function buildSuggestedActions(role: UserRole, settings: AIUserSettings): string[] {
  const shared = settings.auto_summary
    ? 'AI 자동 요약이 활성화되어 있습니다.'
    : 'AI 자동 요약을 켜면 복습 속도를 높일 수 있습니다.';

  if (role === 'STUDENT') {
    return [
      shared,
      '진행률이 낮은 과목부터 우선 복습해 보세요.',
      `언어 설정은 ${settings.language === 'ko' ? '한국어' : '영어'}로 되어 있습니다.`,
    ];
  }

  if (role === 'INSTRUCTOR') {
    return [
      shared,
      '평균 진행률이 낮은 과목부터 자료와 공지를 점검해 보세요.',
      '학생 질문이 많은 강의는 소개 자료를 보강하면 좋습니다.',
    ];
  }

  return [
    shared,
    '운영 중인 과목의 평균 진행률을 낮은 순서로 확인해 보세요.',
    'AI 사용량과 과목별 학습 흐름을 함께 점검하면 우선순위를 정하기 쉽습니다.',
  ];
}

export function getAIRecommendationsForUser(userId: string): AIRecommendationOverview {
  const role = getUserRole(userId);
  const settings = getAIUserSettings(userId);
  const recommendations =
    role === 'STUDENT'
      ? buildStudentRecommendations(userId, settings)
      : role === 'INSTRUCTOR'
        ? buildInstructorRecommendations(userId, settings)
        : buildAdminRecommendations(settings);

  return {
    user_id: userId,
    role,
    settings,
    recommendations,
    suggested_actions: buildSuggestedActions(role, settings),
    updated_at: nowIso(),
  };
}
