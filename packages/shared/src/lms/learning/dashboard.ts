import { getDemoUser } from '../../data/demo-data';
import type { Dashboard, CourseCard } from '../../types';
import { listCourseCards } from './catalog';
import { getAdminActivities, getInstructorActivities, getStudentActivities } from './dashboard-activities';
import { getAdminStats, getCourseStats, getInstructorStats } from './dashboard-stats';

function buildNextAction(role: Dashboard['role'], courses: CourseCard[]): string {
  const enrolledCourses = courses.filter((course) => course.enrolled);
  if (role === 'STUDENT') {
    const nextCourse = enrolledCourses.slice().sort((left, right) => left.progress_percent - right.progress_percent)[0];
    return nextCourse
      ? `${nextCourse.title} ${nextCourse.progress_percent}% 진행 중입니다. 이어서 학습해보세요.`
      : '수강 중인 강의가 없습니다. 관심 있는 코스를 선택해 첫 학습을 시작해보세요.';
  }

  if (role === 'INSTRUCTOR') {
    return '최근 업로드한 자료와 공지를 확인하고 학생 진도 변화를 살펴보세요.';
  }

  return '운영 통계와 AI 사용량을 확인하고 병목이 생긴 코스를 점검하세요.';
}

export function getDashboard(userId: string): Dashboard {
  const courses = listCourseCards(userId);
  const activeEnrollments = courses.filter((course) => course.enrolled).length;
  const user = getDemoUser(userId);
  const role = user?.role ?? 'STUDENT';
  const averageProgress =
    courses.length === 0
      ? 0
      : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  const stats =
    role === 'ADMIN'
      ? getAdminStats(courses)
      : role === 'INSTRUCTOR'
        ? getInstructorStats(userId)
        : getCourseStats(courses);

  const recentActivities =
    role === 'ADMIN'
      ? getAdminActivities()
      : role === 'INSTRUCTOR'
        ? getInstructorActivities(userId)
        : getStudentActivities(userId);

  return {
    learner_name: user?.name ?? '학습자',
    role,
    total_courses: courses.length,
    active_enrollments: activeEnrollments,
    average_progress: averageProgress,
    courses,
    stats,
    recent_activities: recentActivities,
    next_action: buildNextAction(role, courses),
  };
}
