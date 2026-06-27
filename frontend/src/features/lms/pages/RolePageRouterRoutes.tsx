import { Suspense, lazy, type ReactNode } from 'react';
import type { LoginResponse } from '@myway/shared';
import { RolePageFallback } from '../components/RolePageFallback';
import type { LmsDashboardProps, LmsPageId } from '../types';
import { AIChatPage } from './AIChatPage';
import { AISummaryPage } from './AISummaryPage';
import { AssignmentCheckPage } from './AssignmentCheckPage';
import { CourseCreatePage } from './CourseCreatePage';
import { CoursesPage } from './CoursesPage';
import { HomePage } from './HomePage';
import { InstructorDashboardPage } from './InstructorDashboardPage';
import { LectureStudioPage } from './LectureStudioPage';
import { LectureWatchPage } from './LectureWatchPage';
import { MyCoursesPage } from './MyCoursesPage';
import { QuizGenPage } from './QuizGenPage';
import { StudentDashboardPage } from './StudentDashboardPage';

const AdminAssignPage = lazy(() => import('./AdminAssignPage').then((module) => ({ default: module.AdminAssignPage })));
const AdminAutomationPage = lazy(() => import('./AdminAutomationPage').then((module) => ({ default: module.AdminAutomationPage })));
const AdminDashboardPage = lazy(() => import('./AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const AdminInstructorsPage = lazy(() => import('./AdminInstructorsPage').then((module) => ({ default: module.AdminInstructorsPage })));
const AdminStatsPage = lazy(() => import('./AdminStatsPage').then((module) => ({ default: module.AdminStatsPage })));
const AdminUsersPage = lazy(() => import('./AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })));
const MediaPipelinePage = lazy(() => import('./MediaPipelinePage').then((module) => ({ default: module.MediaPipelinePage })));
const ShortformHubPage = lazy(() => import('./ShortformHubPage').then((module) => ({ default: module.ShortformHubPage })));

function withSuspense(node: ReactNode): ReactNode {
  return <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">화면을 불러오는 중입니다.</div>}>{node}</Suspense>;
}

export type RolePageRouterProps = Pick<
  LmsDashboardProps,
  'loading' | 'busy' | 'dashboard' | 'aiLogs' | 'enrolledCourses' | 'highlightedLecture' | 'recommendations' | 'courseCards' | 'insights' | 'onCreateCourse' | 'onEnroll' | 'onSelectCourse' | 'onSelectLecture' | 'demoUsers' | 'selectedCourse' | 'selectedLectureId'
> & {
  session: LoginResponse;
  page: LmsPageId;
  providers: LmsDashboardProps['providers'];
  onNavigate: (page: LmsPageId) => void;
};

export type SharedRouteArgs = {
  session: LoginResponse;
  page: LmsPageId;
  shortformInitialTab: 'create' | 'library' | 'community';
  sessionToken: string;
} & RolePageRouterProps;

function renderMyCourses(args: SharedRouteArgs) {
  return <MyCoursesPage session={args.session} courses={args.courseCards} selectedCourse={args.selectedCourse} onSelectCourse={args.onSelectCourse} onNavigate={args.onNavigate} />;
}

function renderCourses(args: SharedRouteArgs, canManageCurrent: boolean) {
  return <CoursesPage courses={args.courseCards} selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} selectedLectureId={args.selectedLectureId} canManageCurrent={canManageCurrent} busy={args.busy} sessionToken={args.sessionToken} onCreateCourse={args.onCreateCourse} onEnroll={args.onEnroll} onNavigate={args.onNavigate} onSelectCourse={args.onSelectCourse} onSelectLecture={args.onSelectLecture} />;
}

function renderLectureWatch(args: SharedRouteArgs, canManageCurrent: boolean) {
  return <LectureWatchPage courses={args.courseCards} selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} selectedLectureId={args.selectedLectureId} canManageCurrent={canManageCurrent} sessionToken={args.sessionToken} onEnroll={args.onEnroll} onSelectCourse={args.onSelectCourse} onSelectLecture={args.onSelectLecture} onNavigate={args.onNavigate} />;
}

function renderCourseCreate(args: SharedRouteArgs) {
  return <CourseCreatePage courses={args.courseCards} canManageCurrent={true} busy={args.busy} sessionToken={args.sessionToken} selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} onCreateCourse={args.onCreateCourse} onSelectCourse={args.onSelectCourse} onSelectLecture={args.onSelectLecture} onNavigate={args.onNavigate} />;
}

function renderShortform(args: SharedRouteArgs) {
  return withSuspense(<ShortformHubPage session={args.session} highlightedLecture={args.highlightedLecture} selectedCourse={args.selectedCourse} courses={args.courseCards} sessionToken={args.sessionToken} recommendations={args.recommendations} initialTab={args.shortformInitialTab} />);
}

function renderAiChat(args: SharedRouteArgs, canManageCurrent: boolean) {
  return <AIChatPage highlightedLecture={args.highlightedLecture} insights={args.insights} selectedCourse={args.selectedCourse} canManageCurrent={canManageCurrent} sessionToken={args.sessionToken} />;
}

function renderMediaPipeline(args: SharedRouteArgs) {
  return withSuspense(<MediaPipelinePage selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} sessionToken={args.sessionToken} viewerRole={args.session.user.role} />);
}

export function renderHomeRoute(args: SharedRouteArgs) {
  return <HomePage session={args.session} dashboard={args.dashboard} courses={args.courseCards} highlightedLecture={args.highlightedLecture} onNavigate={args.onNavigate} onSelectCourse={args.onSelectCourse} />;
}

export function renderLoadingRoute() {
  return <div className="space-y-5"><section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm"><div className="h-4 w-40 animate-pulse rounded-full bg-white/15" /><div className="mt-4 h-7 w-2/3 animate-pulse rounded-full bg-white/15" /><div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-white/10" /></section><section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-100" /><div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-slate-100" /><div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-slate-100" /><div className="mt-3 h-6 w-full animate-pulse rounded-full bg-slate-100" /></div>)}</section></div>;
}

export function renderRoleRoute(args: SharedRouteArgs): ReactNode {
  if (args.session.user.role === 'ADMIN') {
    switch (args.page) {
      case 'dashboard': return withSuspense(<AdminDashboardPage dashboard={args.dashboard} users={args.demoUsers} courses={args.courseCards} insights={args.insights} />);
      case 'my-courses': return renderMyCourses(args);
      case 'courses': return renderCourses(args, true);
      case 'lecture-watch': return renderLectureWatch(args, true);
      case 'course-create': return renderCourseCreate(args);
      case 'lecture-studio': return <LectureStudioPage courses={args.courseCards} selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} onSelectCourse={args.onSelectCourse} />;
      case 'ai-chat': return renderAiChat(args, true);
      case 'ai-summary': return <AISummaryPage highlightedLecture={args.highlightedLecture} insights={args.insights} />;
      case 'quiz-gen': return <QuizGenPage courses={args.courseCards} />;
      case 'assignment-check': return <AssignmentCheckPage courses={args.courseCards} />;
      case 'admin-users': return withSuspense(<AdminUsersPage users={args.demoUsers} />);
      case 'admin-instructors': return withSuspense(<AdminInstructorsPage instructors={args.demoUsers.filter((user) => user.role === 'INSTRUCTOR')} courses={args.courseCards} />);
      case 'admin-assign': return withSuspense(<AdminAssignPage users={args.demoUsers} courses={args.courseCards} />);
      case 'admin-stats': return withSuspense(<AdminStatsPage dashboard={args.dashboard} courses={args.courseCards} users={args.demoUsers} insights={args.insights} aiLogs={args.aiLogs} />);
      case 'admin-automation': return withSuspense(<AdminAutomationPage providerCatalog={args.providers} />);
      case 'media-pipeline': return renderMediaPipeline(args);
      case 'shortform':
      case 'my-shortforms':
      case 'community': return renderShortform(args);
      default:
        return <RolePageFallback icon="ri-layout-grid-line" title="운영 화면 준비 중" description="사용자 관리, 통계, 강사 배정 화면은 이 디자인 시스템 위에서 다음 단계로 이어집니다." actions={[{ label: '대시보드로 이동', onClick: () => args.onNavigate('dashboard') }, { label: '내 강의 보기', onClick: () => args.onNavigate('my-courses') }]} />;
    }
  }

  if (args.session.user.role === 'INSTRUCTOR') {
    if (args.page === 'my-courses') return renderMyCourses(args);
    if (args.page === 'courses') return renderCourses(args, true);
    if (args.page === 'lecture-watch') return renderLectureWatch(args, true);
    if (args.page === 'course-create') return renderCourseCreate(args);
    if (args.page === 'lecture-studio') return <LectureStudioPage courses={args.courseCards} selectedCourse={args.selectedCourse} highlightedLecture={args.highlightedLecture} onSelectCourse={args.onSelectCourse} />;
    if (args.page === 'ai-chat') return renderAiChat(args, true);
    if (args.page === 'media-pipeline') return renderMediaPipeline(args);
    if (args.page === 'quiz-gen') return <QuizGenPage courses={args.courseCards} />;
    if (args.page === 'ai-summary' || args.page === 'dashboard') return args.page === 'ai-summary' ? <AISummaryPage highlightedLecture={args.highlightedLecture} insights={args.insights} /> : <InstructorDashboardPage dashboard={args.dashboard} courses={args.courseCards} insights={args.insights} />;
    if (args.page === 'assignment-check') return <AssignmentCheckPage courses={args.courseCards} />;
    if (args.page === 'shortform' || args.page === 'my-shortforms' || args.page === 'community') return renderShortform(args);
    return <RolePageFallback icon="ri-tools-line" title="교강사 도구 연결 준비 중" description="현재 레이아웃과 정보 구조는 레퍼런스 기준으로 정리했고, 기능 연결은 다음 단계에서 이어집니다." actions={[{ label: '내 강의로 이동', onClick: () => args.onNavigate('my-courses') }, { label: '강의 개설', onClick: () => args.onNavigate('course-create') }]} />;
  }

  if (args.page === 'courses') return renderCourses(args, false);
  if (args.page === 'lecture-watch') return renderLectureWatch(args, false);
  if (args.page === 'ai-chat') return renderAiChat(args, false);
  if (args.page === 'ai-summary') return <AISummaryPage highlightedLecture={args.highlightedLecture} insights={args.insights} />;
  if (args.page === 'quiz-gen') return <QuizGenPage courses={args.courseCards} />;
  if (args.page === 'assignment-check') return <AssignmentCheckPage courses={args.courseCards} />;
  if (args.page === 'shortform' || args.page === 'my-shortforms' || args.page === 'community') return renderShortform(args);
  if (args.page === 'dashboard') return <StudentDashboardPage session={args.session} dashboard={args.dashboard} courses={args.enrolledCourses} highlightedLecture={args.highlightedLecture} recommendations={args.recommendations} onSelectCourse={args.onSelectCourse} onNavigate={args.onNavigate} />;
  if (args.page === 'my-courses') return renderMyCourses(args);
  if (args.page === 'media-pipeline') return <RolePageFallback icon="ri-lock-line" title="업로드와 전사는 교강사 전용입니다." description="학생은 강의 상세, 챗봇, 숏폼 제작만 사용할 수 있습니다. 영상 업로드와 자동 전사는 교수 또는 강사 계정에서만 가능합니다." actions={[{ label: '강의 상세로', onClick: () => args.onNavigate('courses') }, { label: '내 강의로', onClick: () => args.onNavigate('my-courses') }]} />;
  return <RolePageFallback icon="ri-robot-line" title="학습 도구 연결 준비 중" description="숏폼, 커뮤니티, AI 채팅은 동일한 UI 체계에 맞춰 이어서 붙일 수 있게 정리한 상태입니다." actions={[{ label: '대시보드로 이동', onClick: () => args.onNavigate('dashboard') }, { label: '내 숏폼 보기', onClick: () => args.onNavigate('my-shortforms') }]} />;
}
