import { describe, expect, it, vi } from 'vitest';
import type { CourseCard } from '@myway/shared';
import { refreshLearningState } from './app-state';

const apiMocks = vi.hoisted(() => ({
  loadCourses: vi.fn(),
  loadDashboard: vi.fn(),
  loadAILogs: vi.fn(),
  loadAIInsights: vi.fn(),
  loadAIProviders: vi.fn(),
  loadAIRecommendations: vi.fn(),
  loadAISettings: vi.fn(),
}));

vi.mock('./api', () => ({
  loadCourses: (...args: unknown[]) => apiMocks.loadCourses(...args),
  loadDashboard: (...args: unknown[]) => apiMocks.loadDashboard(...args),
  loadAILogs: (...args: unknown[]) => apiMocks.loadAILogs(...args),
  loadAIInsights: (...args: unknown[]) => apiMocks.loadAIInsights(...args),
  loadAIProviders: (...args: unknown[]) => apiMocks.loadAIProviders(...args),
  loadAIRecommendations: (...args: unknown[]) => apiMocks.loadAIRecommendations(...args),
  loadAISettings: (...args: unknown[]) => apiMocks.loadAISettings(...args),
}));

describe('refreshLearningState', () => {
  it('keeps student selection on an enrolled course after bootstrap', async () => {
    const courses: CourseCard[] = [
      {
        id: 'crs_public',
        instructor_id: 'usr_ins_001',
        title: '공개 코스',
        description: '미수강 코스',
        category: 'AI',
        difficulty: 'beginner',
        is_published: true,
        tags: [],
        instructor_name: '김민준',
        lecture_count: 1,
        enrolled: false,
        progress_percent: 0,
        completed_lectures: 0,
        thumbnail_palette: 'indigo',
        rating: 4.8,
        student_count: 10,
        total_duration_minutes: 30,
      },
      {
        id: 'crs_enrolled',
        instructor_id: 'usr_ins_001',
        title: '수강 중 코스',
        description: '학습 중 코스',
        category: 'AI',
        difficulty: 'beginner',
        is_published: true,
        tags: [],
        instructor_name: '김민준',
        lecture_count: 1,
        enrolled: true,
        progress_percent: 40,
        completed_lectures: 0,
        thumbnail_palette: 'emerald',
        rating: 4.8,
        student_count: 10,
        total_duration_minutes: 45,
      },
    ];

    apiMocks.loadCourses.mockResolvedValueOnce(courses);
    apiMocks.loadDashboard.mockResolvedValueOnce(null);
    apiMocks.loadAILogs.mockResolvedValueOnce(null);
    apiMocks.loadAIInsights.mockResolvedValueOnce(null);
    apiMocks.loadAIProviders.mockResolvedValueOnce(null);
    apiMocks.loadAIRecommendations.mockResolvedValueOnce(null);
    apiMocks.loadAISettings.mockResolvedValueOnce(null);

    let selectedCourseId = '';
    const deps = {
      setCourseCards: vi.fn(),
      setSelectedCourseId: vi.fn((updater: unknown) => {
        selectedCourseId = typeof updater === 'function' ? (updater as (value: string) => string)(selectedCourseId) : String(updater);
      }),
      setDashboard: vi.fn(),
      setAILogs: vi.fn(),
      setInsights: vi.fn(),
      setProviders: vi.fn(),
      setRecommendations: vi.fn(),
      setSettings: vi.fn(),
      setNotice: vi.fn(),
    };

    await refreshLearningState(deps, {
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
    });

    expect(selectedCourseId).toBe('crs_enrolled');
  });
});
