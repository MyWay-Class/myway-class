import type { CourseDetail, LectureDetail } from '@myway/shared';
import { demoCourses } from './demo-auth-courses';

const now = new Date().toISOString();

export const demoCourseDetail: CourseDetail = {
  ...demoCourses[0],
  lectures: [
    {
      id: 'lec_react_01',
      course_id: 'crs_react_01',
      title: 'AI 오케스트레이션 개요',
      order_index: 0,
      week_number: 1,
      session_number: 1,
      content_type: 'video',
      content_text: '제품 아키텍처와 AI 흐름을 연결하는 핵심 개념을 설명합니다.',
      duration_minutes: 24,
      is_published: true,
      is_completed: true,
      video_url: 'https://cdn.mywayclass.dev/demo/ai-orchestration-intro.mp4',
      video_asset_key: 'media/demo/ai-orchestration-intro.mp4',
    },
    {
      id: 'lec_react_02',
      course_id: 'crs_react_01',
      title: '전사와 타임스탬프',
      order_index: 1,
      week_number: 1,
      session_number: 2,
      content_type: 'video',
      content_text: '타임라인과 노트 구조를 통해 복습용 맥락을 만드는 방법을 다룹니다.',
      duration_minutes: 30,
      is_published: true,
      video_url: 'https://cdn.mywayclass.dev/demo/transcript-timeline.mp4',
      video_asset_key: 'media/demo/transcript-timeline.mp4',
    },
    {
      id: 'lec_java_01',
      course_id: 'crs_react_01',
      title: '숏폼 생성과 배포',
      order_index: 2,
      week_number: 2,
      session_number: 1,
      content_type: 'video',
      content_text: '강의 하이라이트를 짧은 영상으로 재가공하는 배포 흐름을 실습합니다.',
      duration_minutes: 28,
      is_published: true,
      video_url: 'https://cdn.mywayclass.dev/demo/shortform-export.mp4',
      video_asset_key: 'media/demo/shortform-export.mp4',
    },
  ],
  materials: [
    {
      id: 'mat_demo_ai_1',
      course_id: 'crs_react_01',
      title: 'AI 서비스 설계 체크리스트',
      summary: '전사, 요약, 챗봇, 숏폼 연결 시 확인해야 할 항목',
      file_name: 'ai-service-checklist.pdf',
      uploaded_by: 'usr_demo_instructor_2',
      uploaded_at: now,
    },
    {
      id: 'mat_demo_ai_2',
      course_id: 'crs_react_01',
      title: '오케스트레이션 설계 노트',
      summary: '프론트, 백엔드, shared 모듈의 책임 분리 예시',
      file_name: 'orchestration-notes.md',
      uploaded_by: 'usr_demo_instructor_2',
      uploaded_at: now,
    },
  ],
  notices: [
    {
      id: 'ntc_demo_ai_1',
      course_id: 'crs_react_01',
      title: '첫 주차 수업 안내',
      content: '이번 주는 전사, 타임스탬프, 숏폼 생성의 전체 흐름을 실습합니다.',
      pinned: true,
      author_id: 'usr_demo_instructor_2',
      created_at: now,
    },
  ],
};

export const demoLectureDetail: LectureDetail = {
  ...demoCourseDetail.lectures[0],
  course_title: demoCourseDetail.title,
  course_instructor: demoCourseDetail.instructor_name,
  previous_lecture_id: undefined,
  next_lecture_id: demoCourseDetail.lectures[1].id,
  is_completed: true,
  video_url: demoCourseDetail.lectures[0].video_url ?? 'https://cdn.mywayclass.dev/demo/ai-orchestration-intro.mp4',
  transcript_excerpt: 'AI는 단순 자동완성이 아니라, 제품 흐름을 따라 기능을 연결하는 실행 파트너로 다뤄야 합니다.',
  keywords: ['오케스트레이션', '전사', '숏폼', '챗봇'],
};
