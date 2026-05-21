import {
  demoCourses,
  demoEnrollments,
  demoLectureProgress,
  demoMaterials,
  demoNotices,
  demoUsers,
} from '../../data/demo-data';
import type { CourseCard, DashboardStat } from '../../types';
import { formatMinutes, stat } from './dashboard-utils';

export function getCourseStats(courses: CourseCard[]): DashboardStat[] {
  const activeCourses = courses.filter((course) => course.enrolled);
  const completedLectures = demoLectureProgress.filter((progress) => progress.is_completed).length;
  const totalLearningMinutes = Math.round(
    activeCourses.reduce((sum, course) => sum + course.total_duration_minutes * (course.progress_percent / 100), 0),
  );

  return [
    stat('courses', '수강 중 강의', String(activeCourses.length), '현재 활성화된 학습 코스', 'ri-book-open-line', 'indigo'),
    stat('completed', '완료 강의', String(completedLectures), '학습 완료로 표시된 강의 수', 'ri-check-double-line', 'emerald'),
    stat('progress', '평균 진도', `${courses.length === 0 ? 0 : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length)}%`, '모든 코스를 포함한 평균 진도', 'ri-line-chart-line', 'violet'),
    stat('minutes', '총 학습 시간', formatMinutes(totalLearningMinutes), '진도 기준으로 환산한 예상 학습 시간', 'ri-time-line', 'amber'),
  ];
}

export function getInstructorStats(userId: string): DashboardStat[] {
  const courseIds = new Set(demoCourses.filter((course) => course.instructor_id === userId).map((course) => course.id));
  const materials = demoMaterials.filter((material) => courseIds.has(material.course_id));
  const notices = demoNotices.filter((notice) => courseIds.has(notice.course_id));
  const activeEnrollments = demoEnrollments.filter((enrollment) => courseIds.has(enrollment.course_id) && enrollment.status === 'active');
  const avgProgress = activeEnrollments.length === 0 ? 0 : Math.round(activeEnrollments.reduce((sum, enrollment) => sum + enrollment.progress_percent, 0) / activeEnrollments.length);

  return [
    stat('courses', '개설 강의', String(courseIds.size), '운영 중인 내 강의 수', 'ri-book-shelf-line', 'indigo'),
    stat('materials', '자료 업로드', String(materials.length), '강의 자료와 첨부 파일', 'ri-folder-3-line', 'emerald'),
    stat('notices', '공지 등록', String(notices.length), '학생에게 전달한 공지 수', 'ri-megaphone-line', 'violet'),
    stat('progress', '평균 진도', `${avgProgress}%`, '내 강의 전체 수강 평균', 'ri-line-chart-line', 'amber'),
  ];
}

export function getAdminStats(courses: CourseCard[]): DashboardStat[] {
  const activeEnrollments = demoEnrollments.filter((enrollment) => enrollment.status === 'active').length;
  const averageProgress = courses.length === 0 ? 0 : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  return [
    stat('users', '전체 사용자', String(demoUsers.length), '운영 중인 학습자와 관리자', 'ri-team-line', 'indigo'),
    stat('courses', '전체 강의', String(demoCourses.length), '시스템에 등록된 강의 수', 'ri-book-shelf-line', 'emerald'),
    stat('enrollments', '활성 수강', String(activeEnrollments), '현재 활성 상태의 수강 등록', 'ri-user-follow-line', 'violet'),
    stat('progress', '평균 진도', `${averageProgress}%`, '플랫폼 전체 평균 진도', 'ri-line-chart-line', 'amber'),
  ];
}
