export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
};

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  bio: string;
};

export type AuthSession = {
  session_token: string;
  user: AuthUser;
  issued_at: string;
};

export type AuthState = {
  authenticated: boolean;
  user: AuthUser | null;
  session_token: string | null;
};

export type LoginRequest = {
  user_id: string;
};

export type LoginResponse = {
  session_token: string;
  user: AuthUser;
  permissions: string[];
};

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type EnrollmentStatus = 'active' | 'paused' | 'completed';

export type LectureContentType = 'video' | 'text';

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

export type Lecture = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  content_type: LectureContentType;
  content_text: string;
  duration_minutes: number;
  is_published: boolean;
};

export type Enrollment = {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
};

export type LectureProgress = {
  id: string;
  user_id: string;
  lecture_id: string;
  is_completed: boolean;
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
  duration_ms?: number;
  language?: string;
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
};

export type Dashboard = {
  learner_name: string;
  role: UserRole;
  total_courses: number;
  active_enrollments: number;
  average_progress: number;
  courses: CourseCard[];
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

export type AIUsageLog = {
  id: string;
  user_id: string | null;
  feature: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: number;
  error_message: string | null;
  created_at: string;
};

export type AIChunkSource = 'lecture' | 'transcript' | 'note';

export type AIIntent =
  | 'request_summary'
  | 'generate_quiz'
  | 'search_content'
  | 'ask_concept'
  | 'ask_recommendation'
  | 'explain_deeper'
  | 'translate'
  | 'compare'
  | 'create_shortform'
  | 'extract_audio'
  | 'analyze_progress'
  | 'general_chat'
  | 'clarify';

export type AIAction = 'SEARCH' | 'DIRECT_ANSWER' | 'CLARIFY' | 'DECOMPOSE';

export type AIIntentRequest = {
  message: string;
  lecture_id?: string;
  context?: string[];
};

export type AIIntentResult = {
  intent: AIIntent;
  confidence: number;
  action: AIAction;
  entities: string[];
  reason: string;
  needs_clarification: boolean;
  lecture_id: string | null;
};

export type AISearchRequest = {
  query: string;
  lecture_id?: string;
  limit?: number;
};

export type AISearchHit = SimilarChunk & {
  lecture_id: string;
  source_type: AIChunkSource;
  source_id: string;
  title: string;
  excerpt: string;
};

export type AISearchResult = {
  query: string;
  lecture_id: string | null;
  hits: AISearchHit[];
};

export type AIReference = AISearchHit;

export type AIAnswerRequest = {
  question: string;
  lecture_id?: string;
  intent_hint?: AIIntent;
  limit?: number;
};

export type AIAnswerResult = {
  question: string;
  lecture_id: string | null;
  intent: AIIntentResult;
  answer: string;
  references: AIReference[];
  suggestions: string[];
};

export type AIQuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  correct_choice_index: number;
  explanation: string;
  reference: AIReference;
};

export type AIQuizRequest = {
  lecture_id: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type AIQuizResult = {
  lecture_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: AIQuizQuestion[];
};

export type AISummaryRequest = {
  lecture_id: string;
  style?: MediaSummaryStyle;
  language?: 'ko' | 'en';
};

export type AISummaryResult = {
  lecture_id: string;
  title: string;
  style: MediaSummaryStyle;
  language: string;
  content: string;
  key_points: string[];
  references: AIReference[];
};
