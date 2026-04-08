import { getDemoUser } from '../../data/demo-data';
import type { Dashboard } from '../../types';
import { listCourseCards } from './catalog';

export function getDashboard(userId: string): Dashboard {
  const courses = listCourseCards(userId);
  const activeEnrollments = courses.filter((course) => course.enrolled).length;
  const user = getDemoUser(userId);
  const averageProgress =
    courses.length === 0
      ? 0
      : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  return {
    learner_name: user?.name ?? '학습자',
    role: user?.role ?? 'STUDENT',
    total_courses: courses.length,
    active_enrollments: activeEnrollments,
    average_progress: averageProgress,
    courses,
  };
}
