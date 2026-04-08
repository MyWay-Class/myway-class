import type {
  AudioExtraction,
  LectureNote,
  LecturePipeline,
  LectureTranscript,
  Material,
  Notice,
} from '../types';

export let demoMaterials: Material[] = [
  {
    id: 'mat_001',
    course_id: 'crs_ai_001',
    title: 'AI 기초 주차 자료',
    summary: '강의 개요, 핵심 개념, 예제 정리본입니다.',
    file_name: 'ai-basics-week1.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-01T09:00:00.000Z',
  },
  {
    id: 'mat_002',
    course_id: 'crs_web_001',
    title: 'React 실습 체크리스트',
    summary: '컴포넌트, 상태 관리, API 연동 점검표입니다.',
    file_name: 'react-practice-checklist.pdf',
    uploaded_by: 'usr_inst_002',
    uploaded_at: '2026-04-02T09:00:00.000Z',
  },
  {
    id: 'mat_003',
    course_id: 'crs_llm_001',
    title: 'RAG 설계 참고자료',
    summary: '검색, 임베딩, 생성 파이프라인 참고 문서입니다.',
    file_name: 'rag-design-notes.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-03T09:00:00.000Z',
  },
];

export let demoNotices: Notice[] = [
  {
    id: 'ntc_001',
    course_id: 'crs_ai_001',
    title: '1주차 과제 안내',
    content: '다음 주차 시작 전까지 AI 개념 요약을 제출해주세요.',
    pinned: true,
    author_id: 'usr_inst_001',
    created_at: '2026-04-01T12:00:00.000Z',
  },
  {
    id: 'ntc_002',
    course_id: 'crs_web_001',
    title: '실습 환경 점검',
    content: 'Node.js 20과 최신 브라우저를 사용해 주세요.',
    pinned: true,
    author_id: 'usr_inst_002',
    created_at: '2026-04-02T12:00:00.000Z',
  },
  {
    id: 'ntc_003',
    course_id: 'crs_llm_001',
    title: '질문 응답 시간 안내',
    content: '질문은 댓글로 남기면 다음 실습 전에 답변드립니다.',
    pinned: false,
    author_id: 'usr_inst_001',
    created_at: '2026-04-03T12:00:00.000Z',
  },
];

export let demoLectureTranscripts: LectureTranscript[] = [];

export let demoLectureNotes: LectureNote[] = [];

export let demoAudioExtractions: AudioExtraction[] = [];

export let demoLecturePipelines: LecturePipeline[] = [];
