import type {
  AudioExtraction,
  LectureNote,
  LecturePipeline,
  LectureTranscript,
  Material,
  Notice,
} from '../types';

export const demoMaterials: Material[] = [
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
    course_id: 'crs_econ_seed_001',
    title: '경제 입문 노트',
    summary: '희소성, 수요/공급, 경기 흐름을 정리한 학습 노트입니다.',
    file_name: 'economics-basics.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-02T09:00:00.000Z',
  },
  {
    id: 'mat_003',
    course_id: 'crs_eng_seed_001',
    title: '영어 회화 표현집',
    summary: '인사, 자기소개, 기초 회화 패턴을 모아둔 자료입니다.',
    file_name: 'english-conversation-notes.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-03T09:00:00.000Z',
  },
  {
    id: 'mat_004',
    course_id: 'crs_java_seed_001',
    title: '자바 문법 체크리스트',
    summary: '변수, 조건문, 반복문, 객체지향 핵심을 정리한 자료입니다.',
    file_name: 'java-checklist.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-04T09:00:00.000Z',
  },
  {
    id: 'mat_005',
    course_id: 'crs_python_seed_001',
    title: '파이썬 자동화 실습 자료',
    summary: '함수, 모듈, 파일 처리 자동화 예제를 담았습니다.',
    file_name: 'python-automation.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'mat_006',
    course_id: 'crs_cert_seed_001',
    title: '자격증 학습 플랜',
    summary: '출제 패턴, 루틴, 오답 정리 전략을 담은 계획서입니다.',
    file_name: 'certificate-plan.pdf',
    uploaded_by: 'usr_inst_001',
    uploaded_at: '2026-04-06T09:00:00.000Z',
  },
];

export const demoNotices: Notice[] = [
  {
    id: 'ntc_001',
    course_id: 'crs_ai_001',
    title: '1주차 과제 안내',
    content: 'AI 개념 요약과 데이터/모델 관계 정리를 제출해주세요.',
    pinned: true,
    author_id: 'usr_inst_001',
    created_at: '2026-04-01T12:00:00.000Z',
  },
  {
    id: 'ntc_002',
    course_id: 'crs_econ_seed_001',
    title: '경제 개념 복습 안내',
    content: '수요와 공급 단원을 보고 시장 균형의 변화를 정리해 보세요.',
    pinned: true,
    author_id: 'usr_inst_001',
    created_at: '2026-04-02T12:00:00.000Z',
  },
  {
    id: 'ntc_003',
    course_id: 'crs_eng_seed_001',
    title: '영어 회화 체크포인트',
    content: '자기소개와 인사 패턴을 소리 내어 반복해 보세요.',
    pinned: false,
    author_id: 'usr_inst_001',
    created_at: '2026-04-03T12:00:00.000Z',
  },
  {
    id: 'ntc_004',
    course_id: 'crs_java_seed_001',
    title: '자바 실습 환경 점검',
    content: 'JDK와 IDE를 확인하고 기본 문법 실습을 준비해 주세요.',
    pinned: true,
    author_id: 'usr_inst_001',
    created_at: '2026-04-04T12:00:00.000Z',
  },
  {
    id: 'ntc_005',
    course_id: 'crs_python_seed_001',
    title: '파이썬 자동화 예고',
    content: '파일 처리와 반복 작업을 자동화하는 예제를 함께 진행합니다.',
    pinned: true,
    author_id: 'usr_inst_001',
    created_at: '2026-04-05T12:00:00.000Z',
  },
  {
    id: 'ntc_006',
    course_id: 'crs_cert_seed_001',
    title: '자격증 학습 루틴 안내',
    content: '매일 오답 정리와 주간 복습 루틴을 반드시 기록해 주세요.',
    pinned: false,
    author_id: 'usr_inst_001',
    created_at: '2026-04-06T12:00:00.000Z',
  },
];

export const demoLectureTranscripts: LectureTranscript[] = [];

export const demoLectureNotes: LectureNote[] = [];

export const demoAudioExtractions: AudioExtraction[] = [];

export const demoLecturePipelines: LecturePipeline[] = [];
