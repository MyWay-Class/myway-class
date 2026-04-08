import type { LoginResponse } from '@myway/shared';
import { RolePageFallback } from '../components/RolePageFallback';
import { AdminAutomationPage } from './AdminAutomationPage';
import { InstructorDashboardPage } from './InstructorDashboardPage';
import { StudentDashboardPage } from './StudentDashboardPage';
import type { LmsDashboardProps, LmsPageId } from '../types';

type RolePageRouterProps = Pick<
  LmsDashboardProps,
  'dashboard' | 'enrolledCourses' | 'highlightedLecture' | 'recommendations' | 'courseCards' | 'insights' | 'onSelectCourse' | 'demoUsers'
> & {
  session: LoginResponse;
  page: LmsPageId;
};

export function RolePageRouter({
  session,
  page,
  dashboard,
  enrolledCourses,
  highlightedLecture,
  recommendations,
  courseCards,
  insights,
  onSelectCourse,
}: RolePageRouterProps) {
  if (session.user.role === 'ADMIN') {
    switch (page) {
      case 'admin-automation':
        return <AdminAutomationPage />;
      default:
        return (
          <RolePageFallback
            icon="ri-layout-grid-line"
            title="운영 화면 준비 중"
            description="사용자 관리, 통계, 강사 배정 화면은 이 디자인 시스템 위에서 다음 단계로 이어집니다."
          />
        );
    }
  }

  if (session.user.role === 'INSTRUCTOR') {
    if (page === 'ai-summary' || page === 'dashboard') {
      return <InstructorDashboardPage courses={courseCards} insights={insights} />;
    }

    return (
      <RolePageFallback
        icon="ri-tools-line"
        title="교강사 도구 연결 준비 중"
        description="현재 레이아웃과 정보 구조는 레퍼런스 기준으로 정리했고, 기능 연결은 다음 단계에서 이어집니다."
      />
    );
  }

  if (page === 'dashboard') {
    return (
      <StudentDashboardPage
        dashboard={dashboard}
        courses={enrolledCourses}
        highlightedLecture={highlightedLecture}
        recommendations={recommendations}
        onSelectCourse={onSelectCourse}
      />
    );
  }

  return (
    <RolePageFallback
      icon="ri-robot-line"
      title="학습 도구 연결 준비 중"
      description="숏폼, 커뮤니티, AI 채팅은 동일한 UI 체계에 맞춰 이어서 붙일 수 있게 정리한 상태입니다."
    />
  );
}
