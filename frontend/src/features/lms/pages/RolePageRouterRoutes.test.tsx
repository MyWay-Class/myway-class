import { describe, expect, it } from 'vitest';
import type { CourseCard, LoginResponse } from '@myway/shared';
import { renderHomeRoute } from './RolePageRouterRoutes';

describe('renderHomeRoute', () => {
  it('passes the full course catalog to the home page', () => {
    const courseCards = [
      { id: 'crs_public', enrolled: false },
      { id: 'crs_enrolled', enrolled: true },
    ] as CourseCard[];
    const enrolledCourses = [courseCards[1]];
    const session = {
      session_token: 'session-token',
      user: {
        id: 'usr_std_001',
        name: '데모 수강생',
        email: 'student@myway.local',
        role: 'STUDENT',
        department: '학습자',
        bio: '학습자',
      },
      permissions: [],
    } satisfies LoginResponse;

    const element = renderHomeRoute({
      session,
      page: 'home',
      shortformInitialTab: 'create',
      sessionToken: session.session_token,
      loading: false,
      busy: false,
      dashboard: null,
      aiLogs: null,
      enrolledCourses,
      highlightedLecture: null,
      recommendations: null,
      courseCards,
      insights: null,
      providers: null,
      onCreateCourse: () => null,
      onEnroll: () => undefined,
      onSelectCourse: () => undefined,
      onSelectLecture: () => undefined,
      demoUsers: [],
      selectedCourse: null,
      selectedLectureId: '',
      onNavigate: () => undefined,
    } as never);

    expect((element as any).props.courses).toBe(courseCards);
  });
});
