import type { AIRecommendationOverview, CourseCard, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import {
  buildStudentStats,
  StudentCourseGrid,
  StudentDashboardHero,
  StudentQuickActions,
  StudentRecentStudy,
  StudentRightPanels,
} from './StudentDashboardPageSections';

type StudentDashboardPageProps = {
  session: LoginResponse;
  dashboard: Dashboard | null;
  courses: CourseCard[];
  highlightedLecture: LectureDetail | null;
  recommendations: AIRecommendationOverview | null;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: 'dashboard' | 'courses' | 'shortform' | 'community' | 'my-shortforms' | 'ai-chat') => void;
};

export function StudentDashboardPage({
  session,
  dashboard,
  courses,
  highlightedLecture,
  recommendations,
  onSelectCourse,
  onNavigate,
}: StudentDashboardPageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const stats = buildStudentStats(dashboard, courses, averageProgress);
  const activities = dashboard?.recent_activities ?? [];
  const recommendationItems = Array.isArray(recommendations?.recommendations) ? recommendations.recommendations : [];
  const nextAction = dashboard?.next_action ?? '로그인 후 개인 학습 흐름을 확인할 수 있습니다.';
  const continueCourse = highlightedLecture
    ? courses.find((course) => course.id === highlightedLecture.course_id) ?? courses[0] ?? null
    : courses[0] ?? null;

  return (
    <div className="space-y-6">
      <StudentDashboardHero
        session={session}
        nextAction={nextAction}
        courses={courses}
        averageProgress={averageProgress}
        highlightedLecture={highlightedLecture}
        activities={activities}
      />

      <DashboardStatsGrid stats={stats} />

      <StudentQuickActions onNavigate={onNavigate} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <StudentRecentStudy
            highlightedLecture={highlightedLecture}
            continueCourse={continueCourse}
            onSelectCourse={onSelectCourse}
            onNavigate={onNavigate}
          />
          <StudentCourseGrid courses={courses} onSelectCourse={onSelectCourse} onNavigate={onNavigate} />
        </div>
        <StudentRightPanels activities={activities} recommendationItems={recommendationItems} />
      </section>
    </div>
  );
}
