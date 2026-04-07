import type { AuthUser, Course, Enrollment, Lecture, LectureProgress } from './types';

export const demoUsers: AuthUser[] = [
  {
    id: 'usr_std_001',
    name: '데모 수강생',
    email: 'student@mywayclass.local',
    role: 'STUDENT',
    department: '학습자',
    bio: '강의 숏폼과 커스텀 강의를 활용해 복습 효율을 높이고 싶은 수강생입니다.',
  },
  {
    id: 'usr_inst_001',
    name: '김민준',
    email: 'instructor1@mywayclass.local',
    role: 'INSTRUCTOR',
    department: 'AI 교육학부',
    bio: '학습 데이터를 기반으로 더 나은 강의를 설계하는 강사입니다.',
  },
  {
    id: 'usr_admin_001',
    name: '오운영',
    email: 'admin@mywayclass.local',
    role: 'ADMIN',
    department: '교육 운영팀',
    bio: '수강 흐름과 운영 데이터를 관리하는 운영자입니다.',
  },
];

export function getDemoUser(userId: string): AuthUser | undefined {
  return demoUsers.find((user) => user.id === userId);
}

export const instructorNames: Record<string, string> = {
  usr_inst_001: '김민준',
  usr_inst_002: '이서연',
};

export const demoCourses: Course[] = [
  {
    id: 'crs_ai_001',
    instructor_id: 'usr_inst_001',
    title: 'AI 기초와 학습 데이터 이해',
    description: 'AI의 기본 개념과 학습 데이터 구조를 함께 익히는 입문 과정입니다.',
    category: 'AI',
    difficulty: 'beginner',
    is_published: true,
    tags: ['AI', '기초', '데이터'],
  },
  {
    id: 'crs_web_001',
    instructor_id: 'usr_inst_002',
    title: 'React와 TypeScript로 만드는 실전 웹앱',
    description: '화면 구성, 상태 관리, API 연결을 다루는 웹 개발 과정입니다.',
    category: 'Web',
    difficulty: 'intermediate',
    is_published: true,
    tags: ['React', 'TypeScript', 'Web'],
  },
  {
    id: 'crs_llm_001',
    instructor_id: 'usr_inst_001',
    title: 'RAG와 프롬프트로 만드는 학습 도우미',
    description: '강의 검색, 요약, 질문응답을 연결하는 AI 학습 보조 과정을 다룹니다.',
    category: 'AI',
    difficulty: 'advanced',
    is_published: true,
    tags: ['RAG', 'LLM', '프롬프트'],
  },
];

export const demoLectures: Lecture[] = [
  {
    id: 'lec_ai_001',
    course_id: 'crs_ai_001',
    title: 'AI란 무엇인가',
    order_index: 0,
    content_type: 'video',
    content_text: 'AI의 정의와 역사, 머신러닝과 딥러닝의 관계를 살펴봅니다.',
    duration_minutes: 18,
    is_published: true,
  },
  {
    id: 'lec_ai_002',
    course_id: 'crs_ai_001',
    title: '학습 데이터와 모델의 관계',
    order_index: 1,
    content_type: 'video',
    content_text: '데이터셋 구성, 라벨링, 검증 데이터의 역할을 다룹니다.',
    duration_minutes: 22,
    is_published: true,
  },
  {
    id: 'lec_web_001',
    course_id: 'crs_web_001',
    title: 'React 컴포넌트 구조',
    order_index: 0,
    content_type: 'video',
    content_text: '함수형 컴포넌트와 상태 흐름, props 전달을 설명합니다.',
    duration_minutes: 25,
    is_published: true,
  },
  {
    id: 'lec_web_002',
    course_id: 'crs_web_001',
    title: 'TypeScript와 폼 처리',
    order_index: 1,
    content_type: 'video',
    content_text: '폼 검증과 타입 안정성을 함께 유지하는 방법을 소개합니다.',
    duration_minutes: 24,
    is_published: true,
  },
  {
    id: 'lec_llm_001',
    course_id: 'crs_llm_001',
    title: 'RAG 파이프라인 설계',
    order_index: 0,
    content_type: 'video',
    content_text: '청킹, 임베딩, 검색, 생성의 연결 구조를 설명합니다.',
    duration_minutes: 30,
    is_published: true,
  },
  {
    id: 'lec_llm_002',
    course_id: 'crs_llm_001',
    title: '강의 요약과 질문응답 연결',
    order_index: 1,
    content_type: 'video',
    content_text: '강의 요약과 챗봇 응답을 하나의 학습 흐름으로 묶는 방법을 다룹니다.',
    duration_minutes: 28,
    is_published: true,
  },
];

export let demoEnrollments: Enrollment[] = [
  {
    id: 'enr_001',
    user_id: 'usr_std_001',
    course_id: 'crs_ai_001',
    status: 'active',
    progress_percent: 50,
  },
  {
    id: 'enr_002',
    user_id: 'usr_std_001',
    course_id: 'crs_llm_001',
    status: 'active',
    progress_percent: 20,
  },
];

export let demoLectureProgress: LectureProgress[] = [
  { id: 'prg_001', user_id: 'usr_std_001', lecture_id: 'lec_ai_001', is_completed: true },
  { id: 'prg_002', user_id: 'usr_std_001', lecture_id: 'lec_ai_002', is_completed: false },
  { id: 'prg_003', user_id: 'usr_std_001', lecture_id: 'lec_llm_001', is_completed: false },
  { id: 'prg_004', user_id: 'usr_std_001', lecture_id: 'lec_llm_002', is_completed: false },
];
