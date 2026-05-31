import type { AIInsights, Dashboard } from '@myway/shared';
import { demoCourses, demoUsers } from './demo-auth-courses';
import { demoCourseDetail } from './demo-learning';

const now = new Date().toISOString();

export const demoDashboard: Dashboard = {
  learner_name: '데모 수강생',
  role: 'ADMIN',
  total_courses: demoCourses.length,
  active_enrollments: 3,
  average_progress: 56,
  courses: demoCourses,
  stats: [
    { id: 'enrollments', label: '활성 수강', value: '3', hint: '현재 운영 중인 수강 등록', icon: 'ri-user-follow-line', tone: 'emerald' },
    { id: 'ai', label: 'AI 요청', value: '148', hint: '최근 AI 사용량', icon: 'ri-robot-line', tone: 'violet' },
    { id: 'courses', label: '전체 강의', value: String(demoCourses.length), hint: '시스템에 등록된 강의 수', icon: 'ri-book-shelf-line', tone: 'amber' },
    { id: 'users', label: '전체 사용자', value: String(demoUsers.length), hint: '운영 중인 학습자와 관리자', icon: 'ri-team-line', tone: 'indigo' },
  ],
  recent_activities: [
    {
      id: 'act_demo_1',
      type: 'ai_summary',
      title: 'AI 요약 생성 완료',
      detail: 'AI 서비스 설계 입문 1주차 요약이 생성되었습니다.',
      timestamp: now,
      icon: 'ri-sparkling-line',
      tone: 'violet',
      course_id: demoCourses[0].id,
      course_title: demoCourses[0].title,
      lecture_id: demoCourseDetail.lectures[0].id,
      lecture_title: demoCourseDetail.lectures[0].title,
    },
    {
      id: 'act_demo_2',
      type: 'shortform',
      title: '숏폼 편집 완료',
      detail: '전사 구간 기반 숏폼 초안이 내보내기 대기 상태입니다.',
      timestamp: now,
      icon: 'ri-scissors-cut-line',
      tone: 'indigo',
      course_id: demoCourses[2].id,
      course_title: demoCourses[2].title,
      lecture_id: 'lec_demo_sf_1',
      lecture_title: '숏폼 컷 편집',
    },
    {
      id: 'act_demo_3',
      type: 'enrollment',
      title: '신규 수강 등록',
      detail: '데이터 기반 의사결정 강의에 학습자가 추가되었습니다.',
      timestamp: now,
      icon: 'ri-user-add-line',
      tone: 'emerald',
      course_id: demoCourses[1].id,
      course_title: demoCourses[1].title,
    },
  ],
  next_action: '전사와 숏폼 배포가 연결된 강의를 먼저 점검해 보세요.',
};

export const demoInsights: AIInsights = {
  role: 'ADMIN',
  summary: {
    total_requests: 148,
    success_rate: 0.96,
    avg_latency_ms: 1240,
    unique_users: 28,
    recent_window_days: 7,
  },
  feature_stats: [
    { feature: 'summary', label: '요약', count: 52, success_rate: 0.98, avg_latency_ms: 980 },
    { feature: 'quiz', label: '퀴즈', count: 22, success_rate: 0.95, avg_latency_ms: 1410 },
    { feature: 'smart', label: '스마트 챗', count: 41, success_rate: 0.96, avg_latency_ms: 1260 },
  ],
  intent_stats: [
    { intent: 'lecture_explain', label: '개념 설명', count: 44, success_rate: 0.97, avg_confidence: 0.91 },
    { intent: 'lecture_summary', label: '요약 요청', count: 33, success_rate: 0.98, avg_confidence: 0.93 },
    { intent: 'quiz_generate', label: '퀴즈 생성', count: 18, success_rate: 0.94, avg_confidence: 0.88 },
  ],
  role_insight: {
    role: 'ADMIN',
    total_users: demoUsers.length,
    published_courses: demoCourses.length,
    total_enrollments: 3,
    ai_usage_7d: 148,
    feature_stats: [
      { feature: 'summary', label: '요약', count: 52, success_rate: 0.98, avg_latency_ms: 980 },
      { feature: 'smart', label: '스마트 챗', count: 41, success_rate: 0.96, avg_latency_ms: 1260 },
    ],
    intent_stats: [
      { intent: 'lecture_explain', label: '개념 설명', count: 44, success_rate: 0.97, avg_confidence: 0.91 },
      { intent: 'quiz_generate', label: '퀴즈 생성', count: 18, success_rate: 0.94, avg_confidence: 0.88 },
    ],
  },
};
