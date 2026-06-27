import { describe, expect, it, vi } from 'vitest';
import type { CourseDetail, LectureDetail, LoginResponse } from '@myway/shared';
import { useAppActions } from './useAppActions';

const actionMocks = vi.hoisted(() => ({
  enrollCourse: vi.fn(),
  loadLectureDetail: vi.fn(),
  refreshLearningState: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  enrollCourse: (...args: unknown[]) => actionMocks.enrollCourse(...args),
  loadLectureDetail: (...args: unknown[]) => actionMocks.loadLectureDetail(...args),
}));

vi.mock('../lib/app-state', () => ({
  refreshLearningState: (...args: unknown[]) => actionMocks.refreshLearningState(...args),
}));

describe('useAppActions', () => {
  it('moves selection to the enrolled course after a successful enroll', async () => {
    const selectedCourse = {
      id: 'crs_enrolled',
      instructor_id: 'usr_ins_001',
      title: '수강 신청 코스',
      description: '설명',
      category: 'AI',
      difficulty: 'beginner',
      is_published: true,
      tags: [],
      instructor_name: '김민준',
      lecture_count: 1,
      enrolled: true,
      progress_percent: 0,
      completed_lectures: 0,
      thumbnail_palette: 'indigo',
      rating: 4.8,
      student_count: 10,
      total_duration_minutes: 30,
      lectures: [
        {
          id: 'lec_enrolled_1',
          course_id: 'crs_enrolled',
          title: '첫 차시',
          order_index: 0,
          content_type: 'video',
          content_text: '내용',
          duration_minutes: 20,
          is_published: true,
        },
      ],
      materials: [],
      notices: [],
    } satisfies CourseDetail;

    const selectedLecture = {
      id: 'lec_enrolled_1',
      course_id: 'crs_enrolled',
      title: '첫 차시',
      order_index: 0,
      content_type: 'video',
      content_text: '내용',
      duration_minutes: 20,
      is_published: true,
      course_title: '수강 신청 코스',
      course_instructor: '김민준',
      video_url: '/video.mp4',
      transcript_excerpt: '내용',
      keywords: [],
    } satisfies LectureDetail;

    actionMocks.enrollCourse.mockResolvedValueOnce({
      enrollmentId: 'enr_123',
      course: selectedCourse,
    });
    actionMocks.loadLectureDetail.mockResolvedValueOnce(selectedLecture);

    let selectedCourseId = '';
    let selectedLectureId = '';
    const setSelectedCourseId = vi.fn((value: unknown) => {
      selectedCourseId = typeof value === 'function' ? (value as (current: string) => string)(selectedCourseId) : String(value);
    });
    const setSelectedLectureId = vi.fn((value: string) => {
      selectedLectureId = value;
    });

    const session: LoginResponse = {
      session_token: 'session-token',
      user: {
        id: 'usr_std_001',
        name: '데모 수강생',
        email: 'student@mywayclass.local',
        role: 'STUDENT',
        department: '학습자',
        bio: '학습자',
      },
      permissions: [],
    };

    const { handleEnroll } = useAppActions({
      session,
      canEnrollCurrent: true,
      canManageCurrent: false,
      setSession: vi.fn(),
      setBusy: vi.fn(),
      setNotice: vi.fn(),
      setSettings: vi.fn(),
      setSelectedCourse: vi.fn(),
      setSelectedCourseId,
      setSelectedLectureId,
      setSelectedLecture: vi.fn(),
      learningDeps: {
        setCourseCards: vi.fn(),
        setSelectedCourseId: vi.fn(),
        setDashboard: vi.fn(),
        setAILogs: vi.fn(),
        setInsights: vi.fn(),
        setProviders: vi.fn(),
        setRecommendations: vi.fn(),
        setSettings: vi.fn(),
        setNotice: vi.fn(),
      },
    });

    await handleEnroll('crs_enrolled');

    expect(actionMocks.refreshLearningState).toHaveBeenCalledTimes(1);
    expect(selectedCourseId).toBe('crs_enrolled');
    expect(selectedLectureId).toBe('lec_enrolled_1');
    expect(actionMocks.loadLectureDetail).toHaveBeenCalledWith('lec_enrolled_1', 'session-token');
  });
});
