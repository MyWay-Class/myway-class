import {
  demoAIIntentLogs,
  demoAIQuestionLogs,
  demoAIUsageLogs,
  demoCourses,
  demoEnrollments,
  demoLectureProgress,
  demoLectures,
  demoMaterials,
  demoNotices,
  demoUsers,
  getDemoUser,
} from '../../data/demo-data';
import type { Dashboard, DashboardActivity, DashboardStat, CourseCard } from '../../types';
import { listCourseCards } from './catalog';

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

function getCourseTitle(courseId: string): string {
  return demoCourses.find((course) => course.id === courseId)?.title ?? '알 수 없는 강의';
}

function getLectureTitle(lectureId: string): string {
  return demoLectures.find((lecture) => lecture.id === lectureId)?.title ?? '알 수 없는 강의';
}

function getActivityTone(type: DashboardActivity['type']): DashboardStat['tone'] {
  if (type === 'enrollment') return 'emerald';
  if (type === 'lecture_complete') return 'indigo';
  if (type === 'material' || type === 'notice') return 'violet';
  if (type === 'insight') return 'amber';
  return 'slate';
}

function getActivityIcon(type: DashboardActivity['type']): string {
  if (type === 'enrollment') return 'ri-book-open-line';
  if (type === 'lecture_complete') return 'ri-check-double-line';
  if (type === 'ai_summary') return 'ri-file-text-line';
  if (type === 'quiz') return 'ri-question-line';
  if (type === 'shortform') return 'ri-scissors-cut-line';
  if (type === 'material') return 'ri-folder-3-line';
  if (type === 'notice') return 'ri-megaphone-line';
  if (type === 'insight') return 'ri-lightbulb-flash-line';
  return 'ri-chat-3-line';
}

function createActivity(input: Omit<DashboardActivity, 'icon' | 'tone'> & { type: DashboardActivity['type'] }): DashboardActivity {
  return {
    ...input,
    icon: getActivityIcon(input.type),
    tone: getActivityTone(input.type),
  };
}

function stat(id: string, label: string, value: string, hint: string, icon: string, tone: DashboardStat['tone']): DashboardStat {
  return { id, label, value, hint, icon, tone };
}

function getCourseStats(courses: CourseCard[]): DashboardStat[] {
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

function getStudentActivities(userId: string): DashboardActivity[] {
  const enrollmentActivities = demoEnrollments
    .filter((enrollment) => enrollment.user_id === userId)
    .map((enrollment) =>
      createActivity({
        id: `activity-enrollment-${enrollment.id}`,
        type: 'enrollment',
        title: `${getCourseTitle(enrollment.course_id)} 수강을 시작했습니다`,
        detail: `진도 ${enrollment.progress_percent}%로 학습을 이어가고 있습니다.`,
        timestamp: enrollment.created_at ?? '2026-04-06T09:00:00.000Z',
        course_id: enrollment.course_id,
        course_title: getCourseTitle(enrollment.course_id),
      }),
    );

  const lectureActivities = demoLectureProgress
    .filter((progress) => progress.user_id === userId && progress.is_completed)
    .map((progress) => {
      const lecture = demoLectures.find((item) => item.id === progress.lecture_id);
      return createActivity({
        id: `activity-complete-${progress.id}`,
        type: 'lecture_complete',
        title: `${getLectureTitle(progress.lecture_id)}를 완료했습니다`,
        detail: lecture ? `${getCourseTitle(lecture.course_id)} · ${lecture.duration_minutes}분 학습 완료` : '강의 완료 기록',
        timestamp: progress.completed_at ?? progress.updated_at ?? '2026-04-08T07:40:00.000Z',
        course_id: lecture?.course_id,
        course_title: lecture ? getCourseTitle(lecture.course_id) : undefined,
        lecture_id: progress.lecture_id,
        lecture_title: getLectureTitle(progress.lecture_id),
      });
    });

  const aiIntentActivities = demoAIIntentLogs
    .filter((log) => log.user_id === userId)
    .map((log) => {
      const type = log.feature === 'summary' ? 'ai_summary' : log.feature === 'quiz' ? 'quiz' : log.feature === 'insights' ? 'insight' : 'ai_chat';
      return createActivity({
        id: `activity-intent-${log.id}`,
        type,
        title: log.feature === 'summary'
          ? 'AI 요약을 생성했습니다'
          : log.feature === 'quiz'
            ? '퀴즈를 생성했습니다'
            : log.feature === 'insights'
              ? 'AI 인사이트를 확인했습니다'
              : 'AI 채팅을 이어갔습니다',
        detail: log.message,
        timestamp: log.created_at,
        course_id: log.course_id ?? undefined,
        course_title: log.course_id ? getCourseTitle(log.course_id) : undefined,
        lecture_id: log.lecture_id ?? undefined,
        lecture_title: log.lecture_id ? getLectureTitle(log.lecture_id) : undefined,
      });
    });

  const aiQuestionActivities = demoAIQuestionLogs
    .filter((log) => log.user_id === userId)
    .map((log) =>
      createActivity({
        id: `activity-question-${log.id}`,
        type: 'ai_chat',
        title: '질문에 대한 답변을 확인했습니다',
        detail: log.question,
        timestamp: log.created_at,
        course_id: log.course_id,
        course_title: getCourseTitle(log.course_id),
        lecture_id: log.lecture_id,
        lecture_title: getLectureTitle(log.lecture_id),
      }),
    );

  const aiUsageActivities = demoAIUsageLogs
    .filter((log) => log.user_id === userId)
    .map((log) =>
      createActivity({
        id: `activity-usage-${log.id}`,
        type: log.feature === 'summary' ? 'ai_summary' : log.feature === 'quiz' ? 'quiz' : log.feature === 'insights' ? 'insight' : 'ai_chat',
        title:
          log.feature === 'summary'
            ? 'AI 요약 요청'
            : log.feature === 'quiz'
              ? 'AI 퀴즈 요청'
              : log.feature === 'insights'
                ? 'AI 인사이트 요청'
                : 'AI 대화 요청',
        detail: `${log.provider} · ${log.model} · ${log.latency_ms}ms`,
        timestamp: log.created_at,
      }),
    );

  return [...enrollmentActivities, ...lectureActivities, ...aiIntentActivities, ...aiQuestionActivities, ...aiUsageActivities]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 5);
}

function getInstructorStats(userId: string): DashboardStat[] {
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

function getInstructorActivities(userId: string): DashboardActivity[] {
  const instructorCourseIds = new Set(demoCourses.filter((course) => course.instructor_id === userId).map((course) => course.id));

  const materialActivities = demoMaterials
    .filter((material) => instructorCourseIds.has(material.course_id))
    .map((material) =>
      createActivity({
        id: `activity-material-${material.id}`,
        type: 'material',
        title: `${material.title} 자료를 업로드했습니다`,
        detail: `${getCourseTitle(material.course_id)} · ${material.file_name}`,
        timestamp: material.uploaded_at,
        course_id: material.course_id,
        course_title: getCourseTitle(material.course_id),
      }),
    );

  const noticeActivities = demoNotices
    .filter((notice) => instructorCourseIds.has(notice.course_id))
    .map((notice) =>
      createActivity({
        id: `activity-notice-${notice.id}`,
        type: 'notice',
        title: `${notice.title} 공지를 등록했습니다`,
        detail: `${getCourseTitle(notice.course_id)} · ${notice.pinned ? '고정 공지' : '일반 공지'}`,
        timestamp: notice.created_at,
        course_id: notice.course_id,
        course_title: getCourseTitle(notice.course_id),
      }),
    );

  const completionActivities = demoLectureProgress
    .filter((progress) => progress.is_completed)
    .map((progress) => {
      const lecture = demoLectures.find((item) => item.id === progress.lecture_id);
      if (!lecture || !instructorCourseIds.has(lecture.course_id)) {
        return null;
      }

      return createActivity({
        id: `activity-instructor-complete-${progress.id}`,
        type: 'lecture_complete',
        title: `${getLectureTitle(progress.lecture_id)}가 완료되었습니다`,
        detail: `${getCourseTitle(lecture.course_id)} 수강생 진도에 반영되었습니다.`,
        timestamp: progress.completed_at ?? progress.updated_at ?? '2026-04-08T07:40:00.000Z',
        course_id: lecture.course_id,
        course_title: getCourseTitle(lecture.course_id),
        lecture_id: lecture.id,
        lecture_title: lecture.title,
      });
    })
    .filter((activity): activity is DashboardActivity => activity !== null);

  const aiActivities = demoAIUsageLogs
    .filter((log) => log.user_id === userId)
    .map((log) =>
      createActivity({
        id: `activity-instructor-ai-${log.id}`,
        type: log.feature === 'summary' ? 'ai_summary' : log.feature === 'quiz' ? 'quiz' : 'ai_chat',
        title:
          log.feature === 'summary'
            ? '강의 요약을 요청했습니다'
            : log.feature === 'quiz'
              ? '퀴즈를 요청했습니다'
              : 'AI 도우미를 사용했습니다',
        detail: `${log.provider} · ${log.model} · ${log.latency_ms}ms`,
        timestamp: log.created_at,
      }),
    );

  return [...materialActivities, ...noticeActivities, ...completionActivities, ...aiActivities]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 5);
}

function getAdminStats(courses: CourseCard[]): DashboardStat[] {
  const activeEnrollments = demoEnrollments.filter((enrollment) => enrollment.status === 'active').length;
  const averageProgress = courses.length === 0 ? 0 : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  return [
    stat('users', '전체 사용자', String(demoUsers.length), '운영 중인 학습자와 관리자', 'ri-team-line', 'indigo'),
    stat('courses', '전체 강의', String(demoCourses.length), '시스템에 등록된 강의 수', 'ri-book-shelf-line', 'emerald'),
    stat('enrollments', '활성 수강', String(activeEnrollments), '현재 활성 상태의 수강 등록', 'ri-user-follow-line', 'violet'),
    stat('progress', '평균 진도', `${averageProgress}%`, '플랫폼 전체 평균 진도', 'ri-line-chart-line', 'amber'),
  ];
}

function getAdminActivities(): DashboardActivity[] {
  const enrollmentActivities = demoEnrollments.map((enrollment) =>
    createActivity({
      id: `activity-admin-enrollment-${enrollment.id}`,
      type: 'enrollment',
      title: `${getCourseTitle(enrollment.course_id)}에 새로운 수강이 있습니다`,
      detail: `진도 ${enrollment.progress_percent}% · ${enrollment.status === 'active' ? '활성' : enrollment.status}`,
      timestamp: enrollment.created_at ?? '2026-04-06T09:10:00.000Z',
      course_id: enrollment.course_id,
      course_title: getCourseTitle(enrollment.course_id),
    }),
  );

  const aiActivities = demoAIUsageLogs.map((log) =>
    createActivity({
      id: `activity-admin-ai-${log.id}`,
      type: log.feature === 'summary' ? 'ai_summary' : log.feature === 'quiz' ? 'quiz' : log.feature === 'insights' ? 'insight' : 'ai_chat',
      title:
        log.feature === 'summary'
          ? 'AI 요약 사용량'
          : log.feature === 'quiz'
            ? 'AI 퀴즈 사용량'
            : log.feature === 'insights'
              ? 'AI 인사이트 사용량'
              : 'AI 채팅 사용량',
      detail: `${log.provider} · ${log.model} · ${log.latency_ms}ms`,
      timestamp: log.created_at,
    }),
  );

  return [...enrollmentActivities, ...aiActivities]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 5);
}

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
