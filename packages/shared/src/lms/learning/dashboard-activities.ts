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
} from '../../data/demo-data';
import type { DashboardActivity } from '../../types';
import { createActivity, getCourseTitle, getLectureTitle } from './dashboard-utils';

export function getStudentActivities(userId: string): DashboardActivity[] {
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

export function getInstructorActivities(userId: string): DashboardActivity[] {
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

export function getAdminActivities(): DashboardActivity[] {
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
