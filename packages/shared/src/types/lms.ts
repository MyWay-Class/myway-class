import type { CourseDifficulty, EnrollmentStatus, LectureContentType, UserRole } from './common';

export type Course = {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  is_published: boolean;
  tags: string[];
};

export type CourseThumbnailPalette = 'indigo' | 'emerald' | 'violet' | 'amber';

export type Lecture = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  week_number?: number;
  session_number?: number;
  content_type: LectureContentType;
  content_text: string;
  duration_minutes: number;
  is_published: boolean;
  is_completed?: boolean;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  created_at?: string;
};

export type LectureProgress = {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: boolean;
  completed_at?: string;
  updated_at?: string;
};

export type Material = {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
};

export type DashboardTone = 'indigo' | 'emerald' | 'violet' | 'amber' | 'slate';

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: string;
  tone: DashboardTone;
};

export type DashboardActivityType =
  | 'enrollment'
  | 'lecture_complete'
  | 'ai_chat'
  | 'ai_summary'
  | 'quiz'
  | 'shortform'
  | 'material'
  | 'notice'
  | 'insight';

export type DashboardActivity = {
  id: string;
  type: DashboardActivityType;
  title: string;
  detail: string;
  timestamp: string;
  icon: string;
  tone: DashboardTone;
  course_id?: string;
  course_title?: string;
  lecture_id?: string;
  lecture_title?: string;
};

export type Notice = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  pinned: boolean;
  author_id: string;
  created_at: string;
};

export type MaterialCreateRequest = {
  title: string;
  summary: string;
  file_name: string;
};

export type NoticeCreateRequest = {
  title: string;
  content: string;
  pinned?: boolean;
};

export type MediaPipelineStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type TranscriptStatus = MediaPipelineStatus;

export type MediaSummaryStyle = 'brief' | 'detailed' | 'timeline';

export type TranscriptSegment = {
  index: number;
  start_ms: number;
  end_ms: number;
  text: string;
};

export type LectureTranscript = {
  id: string;
  lecture_id: string;
  user_id: string;
  language: string;
  full_text: string;
  segments: TranscriptSegment[];
  word_count: number;
  duration_ms: number;
  stt_provider: string;
  stt_model: string;
  created_at: string;
};

export type LectureNote = {
  id: string;
  lecture_id: string;
  user_id: string;
  note_type: 'ai_summary' | 'ai_detailed' | 'ai_timeline';
  title: string;
  content: string;
  key_concepts: string[];
  keywords: string[];
  timestamps: { time_ms: number; label: string; description: string }[] | null;
  language: string;
  ai_model: string;
  created_at: string;
};

export type AudioExtraction = {
  id: string;
  lecture_id: string;
  user_id: string;
  source_type: 'video' | 'audio';
  source_url: string;
  audio_format: string;
  audio_duration_ms: number;
  sample_rate: number;
  channels: number;
  status: MediaPipelineStatus;
  transcript_id: string | null;
  stt_status: TranscriptStatus;
  created_at: string;
};

export type LecturePipeline = {
  lecture_id: string;
  transcript_status: TranscriptStatus;
  summary_status: MediaPipelineStatus;
  audio_status: MediaPipelineStatus;
  transcript_id: string | null;
  note_id: string | null;
  extraction_id: string | null;
  updated_at: string;
};

export type TranscriptCreateRequest = {
  lecture_id: string;
  text?: string;
  audio_url?: string;
  duration_ms?: number;
  language?: string;
  stt_provider?: string;
  stt_model?: string;
  segments?: TranscriptSegment[];
  word_count?: number;
};

export type MediaSummaryRequest = {
  lecture_id: string;
  style?: MediaSummaryStyle;
  language?: 'ko' | 'en';
};

export type AudioExtractionRequest = {
  lecture_id: string;
  video_url?: string;
};

export type CourseCard = Course & {
  instructor_name: string;
  lecture_count: number;
  enrolled: boolean;
  progress_percent: number;
  completed_lectures: number;
  thumbnail_palette: CourseThumbnailPalette;
  rating: number;
  student_count: number;
  total_duration_minutes: number;
};

export type CourseDetail = CourseCard & {
  lectures: Lecture[];
  materials: Material[];
  notices: Notice[];
};

export type LectureDetail = Lecture & {
  course_title: string;
  course_instructor: string;
  previous_lecture_id?: string;
  next_lecture_id?: string;
  is_completed?: boolean;
  video_url: string;
  transcript_excerpt: string;
  keywords: string[];
};

export type Dashboard = {
  learner_name: string;
  role: UserRole;
  total_courses: number;
  active_enrollments: number;
  average_progress: number;
  courses: CourseCard[];
  stats: DashboardStat[];
  recent_activities: DashboardActivity[];
  next_action: string;
};

export type LectureCompletionResult =
  | {
      ok: true;
      lecture_id: string;
      course_id: string;
      progress_percent: number;
      completed_lectures: number;
      total_lectures: number;
    }
  | {
      ok: false;
      reason: 'lecture_not_found' | 'enrollment_required';
    };

export type SimilarChunk = {
  id: string;
  content: string;
  similarity: number;
  chunk_index: number;
};
