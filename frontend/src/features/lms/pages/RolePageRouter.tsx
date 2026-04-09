import type { LoginResponse } from '@myway/shared';
import { RolePageFallback } from '../components/RolePageFallback';
import { AdminAssignPage } from './AdminAssignPage';
import { AdminAutomationPage } from './AdminAutomationPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminInstructorsPage } from './AdminInstructorsPage';
import { AdminStatsPage } from './AdminStatsPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AIChatPage } from './AIChatPage';
import { AISummaryPage } from './AISummaryPage';
import { AssignmentCheckPage } from './AssignmentCheckPage';
import { CommunityPage } from './CommunityPage';
import { CoursesPage } from './CoursesPage';
import { InstructorDashboardPage } from './InstructorDashboardPage';
import { MyShortformsPage } from './MyShortformsPage';
import { QuizGenPage } from './QuizGenPage';
import { ShortformPage } from './ShortformPage';
import { StudentDashboardPage } from './StudentDashboardPage';
import type { LmsDashboardProps, LmsPageId } from '../types';

type RolePageRouterProps = Pick<
  LmsDashboardProps,
  'dashboard' | 'aiLogs' | 'enrolledCourses' | 'highlightedLecture' | 'recommendations' | 'courseCards' | 'insights' | 'onSelectCourse' | 'demoUsers' | 'selectedCourse'
> & {
  session: LoginResponse;
  page: LmsPageId;
  providers: LmsDashboardProps['providers'];
};

export function RolePageRouter({
  session,
  page,
  dashboard,
  aiLogs,
  enrolledCourses,
  highlightedLecture,
  recommendations,
  providers,
  courseCards,
  insights,
  onSelectCourse,
  demoUsers,
  selectedCourse,
}: RolePageRouterProps) {
  const sessionToken = session.session_token;

  if (session.user.role === 'ADMIN') {
    switch (page) {
      case 'dashboard':
        return <AdminDashboardPage dashboard={dashboard} users={demoUsers} courses={courseCards} insights={insights} />;
      case 'courses':
        return <CoursesPage courses={courseCards} onSelectCourse={onSelectCourse} />;
      case 'admin-users':
        return <AdminUsersPage users={demoUsers} />;
      case 'admin-instructors':
        return <AdminInstructorsPage instructors={demoUsers.filter((user) => user.role === 'INSTRUCTOR')} courses={courseCards} />;
      case 'admin-assign':
        return <AdminAssignPage users={demoUsers} courses={courseCards} />;
      case 'admin-stats':
        return <AdminStatsPage dashboard={dashboard} courses={courseCards} users={demoUsers} insights={insights} aiLogs={aiLogs} />;
      case 'admin-automation':
        return <AdminAutomationPage providerCatalog={providers} />;
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
    if (page === 'courses') {
      return <CoursesPage courses={courseCards} onSelectCourse={onSelectCourse} />;
    }

    if (page === 'shortform') {
      return <ShortformPage highlightedLecture={highlightedLecture} selectedCourse={selectedCourse} courses={courseCards} sessionToken={sessionToken} />;
    }

    if (page === 'community') {
      return <CommunityPage courses={courseCards} recommendations={recommendations} />;
    }

    if (page === 'ai-chat') {
      return <AIChatPage highlightedLecture={highlightedLecture} insights={insights} />;
    }

    if (page === 'quiz-gen') {
      return <QuizGenPage courses={courseCards} />;
    }

    if (page === 'ai-summary' || page === 'dashboard') {
      return page === 'ai-summary'
        ? <AISummaryPage highlightedLecture={highlightedLecture} insights={insights} />
        : <InstructorDashboardPage courses={courseCards} insights={insights} />;
    }

    if (page === 'assignment-check') {
      return <AssignmentCheckPage courses={courseCards} />;
    }

    return (
      <RolePageFallback
        icon="ri-tools-line"
        title="교강사 도구 연결 준비 중"
        description="현재 레이아웃과 정보 구조는 레퍼런스 기준으로 정리했고, 기능 연결은 다음 단계에서 이어집니다."
      />
    );
  }

  if (page === 'courses') {
    return <CoursesPage courses={courseCards} onSelectCourse={onSelectCourse} />;
  }

  if (page === 'shortform') {
    return <ShortformPage highlightedLecture={highlightedLecture} selectedCourse={selectedCourse} courses={courseCards} sessionToken={sessionToken} />;
  }

  if (page === 'my-shortforms') {
    return <MyShortformsPage courses={courseCards} selectedCourse={selectedCourse} sessionToken={sessionToken} />;
  }

  if (page === 'community') {
    return <CommunityPage courses={courseCards} recommendations={recommendations} />;
  }

  if (page === 'ai-chat') {
    return <AIChatPage highlightedLecture={highlightedLecture} insights={insights} />;
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
