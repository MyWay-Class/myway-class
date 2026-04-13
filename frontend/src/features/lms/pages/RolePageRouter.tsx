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
import { CourseCreatePage } from './CourseCreatePage';
import { CoursesPage } from './CoursesPage';
import { InstructorDashboardPage } from './InstructorDashboardPage';
import { LectureWatchPage } from './LectureWatchPage';
import { LectureStudioPage } from './LectureStudioPage';
import { HomePage } from './HomePage';
import { MyCoursesPage } from './MyCoursesPage';
import { MediaPipelinePage } from './MediaPipelinePage';
import { QuizGenPage } from './QuizGenPage';
import { ShortformHubPage } from './ShortformHubPage';
import { StudentDashboardPage } from './StudentDashboardPage';
import type { LmsDashboardProps, LmsPageId } from '../types';

type RolePageRouterProps = Pick<
  LmsDashboardProps,
  'loading' | 'busy' | 'dashboard' | 'aiLogs' | 'enrolledCourses' | 'highlightedLecture' | 'recommendations' | 'courseCards' | 'insights' | 'onCreateCourse' | 'onEnroll' | 'onSelectCourse' | 'onSelectLecture' | 'demoUsers' | 'selectedCourse' | 'selectedLectureId'
> & {
  session: LoginResponse;
  page: LmsPageId;
  providers: LmsDashboardProps['providers'];
  onNavigate: (page: LmsPageId) => void;
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
  onSelectLecture,
  onCreateCourse,
  onEnroll,
  demoUsers,
  selectedCourse,
  selectedLectureId,
  loading,
  busy,
  onNavigate,
}: RolePageRouterProps) {
  const sessionToken = session.session_token;
  const shortformInitialTab = page === 'my-shortforms' ? 'library' : page === 'community' ? 'community' : 'create';

  if (page === 'home') {
    return (
      <HomePage
        session={session}
        dashboard={dashboard}
        courses={enrolledCourses}
        highlightedLecture={highlightedLecture}
        onNavigate={onNavigate}
        onSelectCourse={onSelectCourse}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/15" />
          <div className="mt-4 h-7 w-2/3 animate-pulse rounded-full bg-white/15" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
        </section>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
              <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" />
              <div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-3 h-6 w-full animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </section>
      </div>
    );
  }

  if (session.user.role === 'ADMIN') {
    switch (page) {
      case 'dashboard':
        return <AdminDashboardPage dashboard={dashboard} users={demoUsers} courses={courseCards} insights={insights} />;
      case 'my-courses':
        return (
          <MyCoursesPage
            session={session}
            courses={courseCards}
            selectedCourse={selectedCourse}
            onSelectCourse={onSelectCourse}
            onNavigate={onNavigate}
          />
        );
      case 'courses':
        return (
          <CoursesPage
            courses={courseCards}
            selectedCourse={selectedCourse}
            highlightedLecture={highlightedLecture}
            selectedLectureId={selectedLectureId}
            canManageCurrent={true}
            busy={busy}
            sessionToken={sessionToken}
            onCreateCourse={onCreateCourse}
            onEnroll={onEnroll}
            onNavigate={onNavigate}
            onSelectCourse={onSelectCourse}
            onSelectLecture={onSelectLecture}
          />
        );
      case 'lecture-watch':
        return (
          <LectureWatchPage
            courses={courseCards}
            selectedCourse={selectedCourse}
            highlightedLecture={highlightedLecture}
            selectedLectureId={selectedLectureId}
            canManageCurrent={true}
            sessionToken={sessionToken}
            onEnroll={onEnroll}
            onSelectCourse={onSelectCourse}
            onSelectLecture={onSelectLecture}
            onNavigate={onNavigate}
          />
        );
      case 'course-create':
        return (
          <CourseCreatePage
            courses={courseCards}
            canManageCurrent={true}
            busy={busy}
            sessionToken={sessionToken}
            selectedCourse={selectedCourse}
            highlightedLecture={highlightedLecture}
            onCreateCourse={onCreateCourse}
            onSelectCourse={onSelectCourse}
            onSelectLecture={onSelectLecture}
            onNavigate={onNavigate}
          />
        );
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
      case 'media-pipeline':
        return (
          <MediaPipelinePage
            selectedCourse={selectedCourse}
            highlightedLecture={highlightedLecture}
            sessionToken={sessionToken}
            viewerRole={session.user.role}
          />
        );
      case 'shortform':
      case 'my-shortforms':
      case 'community':
        return (
          <ShortformHubPage
            session={session}
            highlightedLecture={highlightedLecture}
            selectedCourse={selectedCourse}
            courses={courseCards}
            sessionToken={sessionToken}
            recommendations={recommendations}
            initialTab={shortformInitialTab}
          />
        );
      default:
        return (
          <RolePageFallback
            icon="ri-layout-grid-line"
            title="운영 화면 준비 중"
            description="사용자 관리, 통계, 강사 배정 화면은 이 디자인 시스템 위에서 다음 단계로 이어집니다."
            actions={[
              { label: '대시보드로 이동', onClick: () => onNavigate('dashboard') },
              { label: '내 강의 보기', onClick: () => onNavigate('my-courses') },
            ]}
          />
        );
    }
  }

  if (session.user.role === 'INSTRUCTOR') {
    if (page === 'my-courses') {
      return (
        <MyCoursesPage
          session={session}
          courses={courseCards}
          selectedCourse={selectedCourse}
          onSelectCourse={onSelectCourse}
          onNavigate={onNavigate}
        />
      );
    }

    if (page === 'courses') {
      return (
        <CoursesPage
          courses={courseCards}
          selectedCourse={selectedCourse}
          highlightedLecture={highlightedLecture}
          selectedLectureId={selectedLectureId}
            canManageCurrent={true}
            busy={busy}
            sessionToken={sessionToken}
            onCreateCourse={onCreateCourse}
            onEnroll={onEnroll}
            onNavigate={onNavigate}
            onSelectCourse={onSelectCourse}
            onSelectLecture={onSelectLecture}
        />
      );
    }

    if (page === 'lecture-watch') {
      return (
        <LectureWatchPage
          courses={courseCards}
          selectedCourse={selectedCourse}
          highlightedLecture={highlightedLecture}
          selectedLectureId={selectedLectureId}
          canManageCurrent={true}
          sessionToken={sessionToken}
          onEnroll={onEnroll}
          onSelectCourse={onSelectCourse}
          onSelectLecture={onSelectLecture}
          onNavigate={onNavigate}
        />
      );
    }

    if (page === 'course-create') {
      return (
        <CourseCreatePage
          courses={courseCards}
          canManageCurrent={true}
          busy={busy}
          sessionToken={sessionToken}
          selectedCourse={selectedCourse}
          highlightedLecture={highlightedLecture}
          onCreateCourse={onCreateCourse}
          onSelectCourse={onSelectCourse}
          onSelectLecture={onSelectLecture}
          onNavigate={onNavigate}
        />
      );
    }

    if (page === 'lecture-studio') {
      return (
        <LectureStudioPage
          courses={courseCards}
          selectedCourse={selectedCourse}
          highlightedLecture={highlightedLecture}
          onSelectCourse={onSelectCourse}
        />
      );
    }

    if (page === 'ai-chat') {
      return <AIChatPage highlightedLecture={highlightedLecture} insights={insights} selectedCourse={selectedCourse} canManageCurrent={true} sessionToken={sessionToken} />;
    }

    if (page === 'media-pipeline') {
      return (
        <MediaPipelinePage
          selectedCourse={selectedCourse}
          highlightedLecture={highlightedLecture}
          sessionToken={sessionToken}
          viewerRole={session.user.role}
        />
      );
    }

    if (page === 'quiz-gen') {
      return <QuizGenPage courses={courseCards} />;
    }

    if (page === 'ai-summary' || page === 'dashboard') {
      return page === 'ai-summary'
        ? <AISummaryPage highlightedLecture={highlightedLecture} insights={insights} />
        : <InstructorDashboardPage dashboard={dashboard} courses={courseCards} insights={insights} />;
    }

    if (page === 'assignment-check') {
      return <AssignmentCheckPage courses={courseCards} />;
    }

    if (page === 'shortform' || page === 'my-shortforms' || page === 'community') {
      return (
        <ShortformHubPage
          session={session}
          highlightedLecture={highlightedLecture}
          selectedCourse={selectedCourse}
          courses={courseCards}
          sessionToken={sessionToken}
          recommendations={recommendations}
          initialTab={shortformInitialTab}
        />
      );
    }

    return (
      <RolePageFallback
        icon="ri-tools-line"
        title="교강사 도구 연결 준비 중"
        description="현재 레이아웃과 정보 구조는 레퍼런스 기준으로 정리했고, 기능 연결은 다음 단계에서 이어집니다."
        actions={[
          { label: '내 강의로 이동', onClick: () => onNavigate('my-courses') },
          { label: '강의 개설', onClick: () => onNavigate('course-create') },
        ]}
      />
    );
  }

  if (page === 'courses') {
    return (
      <CoursesPage
        courses={courseCards}
        selectedCourse={selectedCourse}
        highlightedLecture={highlightedLecture}
        selectedLectureId={selectedLectureId}
        canManageCurrent={false}
        busy={busy}
        sessionToken={sessionToken}
        onEnroll={onEnroll}
        onCreateCourse={onCreateCourse}
        onNavigate={onNavigate}
        onSelectCourse={onSelectCourse}
        onSelectLecture={onSelectLecture}
      />
    );
  }

  if (page === 'lecture-watch') {
    return (
      <LectureWatchPage
        courses={courseCards}
        selectedCourse={selectedCourse}
        highlightedLecture={highlightedLecture}
        selectedLectureId={selectedLectureId}
        canManageCurrent={false}
        sessionToken={sessionToken}
        onEnroll={onEnroll}
        onSelectCourse={onSelectCourse}
        onSelectLecture={onSelectLecture}
        onNavigate={onNavigate}
      />
    );
  }

  if (page === 'ai-chat') {
    return <AIChatPage highlightedLecture={highlightedLecture} insights={insights} selectedCourse={selectedCourse} canManageCurrent={false} sessionToken={sessionToken} />;
  }

  if (page === 'shortform' || page === 'my-shortforms' || page === 'community') {
    return (
      <ShortformHubPage
        session={session}
        highlightedLecture={highlightedLecture}
        selectedCourse={selectedCourse}
        courses={courseCards}
        sessionToken={sessionToken}
        recommendations={recommendations}
        initialTab={shortformInitialTab}
      />
    );
  }

  if (page === 'dashboard') {
    return (
      <StudentDashboardPage
        session={session}
        dashboard={dashboard}
        courses={enrolledCourses}
        highlightedLecture={highlightedLecture}
        recommendations={recommendations}
        onSelectCourse={onSelectCourse}
        onNavigate={onNavigate}
      />
    );
  }

  if (page === 'my-courses') {
    return (
      <MyCoursesPage
        session={session}
        courses={courseCards}
        selectedCourse={selectedCourse}
        onSelectCourse={onSelectCourse}
        onNavigate={onNavigate}
      />
    );
  }

  if (page === 'media-pipeline') {
    return (
      <RolePageFallback
        icon="ri-lock-line"
        title="업로드와 전사는 교강사 전용입니다."
        description="학생은 강의 상세, 챗봇, 숏폼 제작만 사용할 수 있습니다. 영상 업로드와 자동 전사는 교수 또는 강사 계정에서만 가능합니다."
        actions={[
          { label: '강의 상세로', onClick: () => onNavigate('courses') },
          { label: '내 강의로', onClick: () => onNavigate('my-courses') },
        ]}
      />
    );
  }

  return (
    <RolePageFallback
      icon="ri-robot-line"
      title="학습 도구 연결 준비 중"
      description="숏폼, 커뮤니티, AI 채팅은 동일한 UI 체계에 맞춰 이어서 붙일 수 있게 정리한 상태입니다."
      actions={[
        { label: '대시보드로 이동', onClick: () => onNavigate('dashboard') },
        { label: '내 숏폼 보기', onClick: () => onNavigate('my-shortforms') },
      ]}
    />
  );
}
