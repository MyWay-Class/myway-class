import type { AuthUser, CourseCard, CourseDetail, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { CatalogPanel } from './dashboard/CatalogPanel';
import { IdentityPanel } from './dashboard/IdentityPanel';
import { LecturePanel } from './dashboard/LecturePanel';

type LmsDashboardProps = {
  loading: boolean;
  busy: boolean;
  notice: string;
  session: LoginResponse | null;
  dashboard: Dashboard | null;
  courseCards: CourseCard[];
  selectedCourseId: string;
  selectedCourse: CourseDetail | null;
  selectedLectureId: string;
  highlightedLecture: LectureDetail | null;
  enrolledCourses: CourseCard[];
  canEnrollCurrent: boolean;
  demoUsers: AuthUser[];
  onLogin: (userId: string) => void;
  onLogout: () => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
  onCompleteLecture: (lectureId: string) => void;
  getCurrentRoleLabel: () => string;
};

export function LmsDashboard(props: LmsDashboardProps) {
  return (
    <main className="app-shell">
      <IdentityPanel
        busy={props.busy}
        demoUsers={props.demoUsers}
        enrolledCourses={props.enrolledCourses}
        getCurrentRoleLabel={props.getCurrentRoleLabel}
        loading={props.loading}
        notice={props.notice}
        onLogin={props.onLogin}
        onLogout={props.onLogout}
        session={props.session}
      />

      <CatalogPanel
        busy={props.busy}
        canEnrollCurrent={props.canEnrollCurrent}
        courseCards={props.courseCards}
        dashboard={props.dashboard}
        onEnroll={props.onEnroll}
        onSelectCourse={props.onSelectCourse}
        onSelectLecture={props.onSelectLecture}
        selectedCourse={props.selectedCourse}
        selectedCourseId={props.selectedCourseId}
        selectedLectureId={props.selectedLectureId}
      />

      <LecturePanel
        busy={props.busy}
        highlightedLecture={props.highlightedLecture}
        onCompleteLecture={props.onCompleteLecture}
        onSelectLecture={props.onSelectLecture}
        selectedCourse={props.selectedCourse}
        selectedLectureId={props.selectedLectureId}
        session={props.session}
      />
    </main>
  );
}
