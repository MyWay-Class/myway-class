import type { Dispatch, SetStateAction } from 'react';
import type { AIInsights, CourseCard, Dashboard, LoginResponse } from '@myway/shared';
import { loadAIInsights, loadCourses, loadDashboard } from './api';

type RefreshLearningStateDeps = {
  setCourseCards: Dispatch<SetStateAction<CourseCard[]>>;
  setSelectedCourseId: Dispatch<SetStateAction<string>>;
  setDashboard: Dispatch<SetStateAction<Dashboard | null>>;
  setInsights: Dispatch<SetStateAction<AIInsights | null>>;
  setNotice: Dispatch<SetStateAction<string>>;
};

export async function refreshLearningState(
  deps: RefreshLearningStateDeps,
  activeSession: LoginResponse | null,
): Promise<void> {
  const courses = await loadCourses(activeSession?.session_token);
  deps.setCourseCards(courses);

  if (courses.length > 0) {
    deps.setSelectedCourseId((current) => current || courses[0].id);
  }

  if (activeSession) {
    const dashboardData = await loadDashboard(activeSession.session_token);
    const insightsData = await loadAIInsights(activeSession.session_token);
    deps.setDashboard(dashboardData);
    deps.setInsights(insightsData);
    deps.setNotice(`${activeSession.user.name} 님, ${activeSession.user.role} 계정으로 로그인했습니다.`);
  } else {
    deps.setDashboard(null);
    deps.setInsights(null);
    deps.setNotice('로그인 후 내 정보와 진도가 활성화됩니다.');
  }
}
