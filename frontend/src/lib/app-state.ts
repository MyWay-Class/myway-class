import type { Dispatch, SetStateAction } from 'react';
import type {
  AIInsights,
  AIProviderCatalog,
  AIRecommendationOverview,
  AIUserSettings,
  CourseCard,
  Dashboard,
  LoginResponse,
} from '@myway/shared';
import { loadAIInsights, loadAIProviders, loadAIRecommendations, loadAISettings, loadCourses, loadDashboard } from './api';

type RefreshLearningStateDeps = {
  setCourseCards: Dispatch<SetStateAction<CourseCard[]>>;
  setSelectedCourseId: Dispatch<SetStateAction<string>>;
  setDashboard: Dispatch<SetStateAction<Dashboard | null>>;
  setInsights: Dispatch<SetStateAction<AIInsights | null>>;
  setProviders: Dispatch<SetStateAction<AIProviderCatalog | null>>;
  setRecommendations: Dispatch<SetStateAction<AIRecommendationOverview | null>>;
  setSettings: Dispatch<SetStateAction<AIUserSettings | null>>;
  setNotice: Dispatch<SetStateAction<string>>;
};

export async function refreshLearningState(
  deps: RefreshLearningStateDeps,
  activeSession: LoginResponse | null,
): Promise<void> {
  const [courses, dashboardData, insightsData, providersData, recommendationsData, settingsData] = await Promise.all([
    loadCourses(activeSession?.session_token),
    activeSession ? loadDashboard(activeSession.session_token) : Promise.resolve(null),
    activeSession ? loadAIInsights(activeSession.session_token) : Promise.resolve(null),
    activeSession ? loadAIProviders(activeSession.session_token) : Promise.resolve(null),
    activeSession ? loadAIRecommendations(activeSession.session_token) : Promise.resolve(null),
    activeSession ? loadAISettings(activeSession.session_token) : Promise.resolve(null),
  ]);

  deps.setCourseCards(courses);

  if (courses.length > 0) {
    deps.setSelectedCourseId((current) => current || courses[0].id);
  }

  if (activeSession) {
    deps.setDashboard(dashboardData);
    deps.setInsights(insightsData);
    deps.setProviders(providersData);
    deps.setRecommendations(recommendationsData);
    deps.setSettings(settingsData);
    deps.setNotice(`${activeSession.user.name} 님, ${activeSession.user.role} 계정으로 로그인했습니다.`);
  } else {
    deps.setDashboard(null);
    deps.setInsights(null);
    deps.setProviders(null);
    deps.setRecommendations(null);
    deps.setSettings(null);
    deps.setNotice('로그인 후 내 정보와 진도가 활성화됩니다.');
  }
}
