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

export type AIIntentLog = {
  id: string;
  user_id: string;
  message: string;
  detected_intent: AIIntent;
  confidence: number;
  feature: string;
  success: boolean;
  action_taken: string;
  lecture_id: string | null;
  course_id: string | null;
  created_at: string;
};

export type AIQuestionLog = {
  id: string;
  user_id: string;
  lecture_id: string;
  course_id: string;
  question: string;
  answer: string;
  model: string;
  success: boolean;
  created_at: string;
};

export type AIInsightFeatureStat = {
  feature: string;
  label: string;
  count: number;
  success_rate: number;
  avg_latency_ms: number;
};

export type AIInsightIntentStat = {
  intent: AIIntent | 'unknown';
  label: string;
  count: number;
  success_rate: number;
  avg_confidence: number;
};

export type AIInsightSummary = {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  unique_users: number;
  recent_window_days: number;
};

export type AIStudentInsight = {
  role: 'STUDENT';
  total_requests: number;
  recent_intents: AIInsightIntentStat[];
  feature_stats: AIInsightFeatureStat[];
  recommended_actions: string[];
};

export type AIInstructorLectureInsight = {
  lecture_id: string;
  lecture_title: string;
  question_count: number;
};

export type AIInstructorInsight = {
  role: 'INSTRUCTOR';
  total_questions: number;
  top_lecture_questions: AIInstructorLectureInsight[];
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
};

export type AIAdminInsight = {
  role: 'ADMIN';
  total_users: number;
  published_courses: number;
  total_enrollments: number;
  ai_usage_7d: number;
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
};

export type AIInsights = {
  role: UserRole;
  summary: AIInsightSummary;
  feature_stats: AIInsightFeatureStat[];
  intent_stats: AIInsightIntentStat[];
  role_insight: AIStudentInsight | AIInstructorInsight | AIAdminInsight;
};

export type AIThemePreference = 'light' | 'dark' | 'system';

export type AIRecommendationMode = 'progress' | 'discovery' | 'balanced';

export type AIRecommendationSource = 'progress' | 'discovery' | 'review' | 'management';

export type AIUserSettings = {
  user_id: string;
  language: 'ko' | 'en';
  theme: AIThemePreference;
  auto_summary: boolean;
  recommendation_mode: AIRecommendationMode;
  updated_at: string;
};

export type AIUserSettingsUpdateRequest = {
  language?: 'ko' | 'en';
  theme?: AIThemePreference;
  auto_summary?: boolean;
  recommendation_mode?: AIRecommendationMode;
};

export type AIRecommendationCard = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  instructor_name: string;
  progress_percent: number;
  reason: string;
  score: number;
  is_enrolled: boolean;
  source: AIRecommendationSource;
  tags: string[];
};

export type AIRecommendationOverview = {
  user_id: string;
  role: UserRole;
  settings: AIUserSettings;
  recommendations: AIRecommendationCard[];
  suggested_actions: string[];
  updated_at: string;
};

export type CustomCourseStatus = 'DRAFT' | 'COMPOSING' | 'READY' | 'SHARED' | 'COPIED' | 'ARCHIVED';

export type CustomCourseClip = {
  id: string;
  custom_course_id: string;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  order_index: number;
  source_video_url: string;
};

export type CustomCourse = {
  id: string;
  course_id: string;
  owner_id: string;
  title: string;
  description: string;
  status: CustomCourseStatus;
  source_lecture_ids: string[];
  clip_count: number;
  total_duration_ms: number;
  share_count: number;
  copy_count: number;
  copied_from_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CustomCourseShare = {
  id: string;
  custom_course_id: string;
  course_id: string;
  shared_by: string;
  visibility: 'course';
  message: string | null;
  created_at: string;
};

export type CustomCourseComposeClipRequest = {
  lecture_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label?: string;
  description?: string;
};

export type CustomCourseComposeRequest = {
  course_id: string;
  title: string;
  description?: string;
  clips: CustomCourseComposeClipRequest[];
};

export type CustomCourseShareRequest = {
  message?: string;
};

export type CustomCourseCopyRequest = {
  custom_course_id: string;
  title?: string;
  description?: string;
};

export type CustomCourseDetail = CustomCourse & {
  clips: CustomCourseClip[];
  shares: CustomCourseShare[];
};

export type CustomCourseCommunityItem = CustomCourseDetail & {
  shared_by_name: string;
  course_title: string;
  is_copied_by_user: boolean;
};

export type CustomCourseLibraryItem = CustomCourseDetail & {
  ownership: 'owned' | 'copied';
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

export type SmartChatRequest = {
  message: string;
  lecture_id?: string;
  course_id?: string;
  context?: string[];
  language?: 'ko' | 'en';
};

export type SmartChatRoute = 'summary' | 'quiz' | 'search' | 'answer' | 'translate' | 'compare' | 'clarify' | 'general';

export type SmartChatResult = {
  message: string;
  lecture_id: string | null;
  course_id: string | null;
  route: SmartChatRoute;
  intent: AIIntentResult;
  answer: string;
  references: AIReference[];
  suggestions: string[];
  summary?: AISummaryResult | null;
  quiz?: AIQuizResult | null;
};

export type ShortformStyle = 'highlight' | 'exam_prep' | 'quick_review' | 'deep_dive' | 'custom';

export type ShortformStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'PUBLIC' | 'ARCHIVED';

export type ShortformCandidate = {
  id: string;
  extraction_id: string;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  importance: number;
  order_index: number;
  is_selected: boolean;
};

export type ShortformExtraction = {
  id: string;
  user_id: string;
  course_id: string;
  mode: 'single' | 'cross';
  lecture_ids: string[];
  style: ShortformStyle;
  target_duration_sec: number;
  language: string;
  ai_model: string;
  ai_response: string;
  total_candidates: number;
  created_at: string;
};

export type ShortformClip = {
  id: string;
  shortform_id: string;
  lecture_id: string;
  lecture_title: string;
  course_id: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
  order_index: number;
  source_video_url: string;
};

export type ShortformVideo = {
  id: string;
  shortform_id: string;
  user_id: string;
  title: string;
  description: string;
  duration_ms: number;
  total_segments: number;
  course_id: string;
  source_lecture_ids: string[];
  status: ShortformStatus;
  video_url: string;
  share_count: number;
  like_count: number;
  save_count: number;
  view_count: number;
  created_at: string;
};

export type ShortformShare = {
  id: string;
  video_id: string;
  course_id: string;
  shared_by: string;
  visibility: 'course';
  message: string | null;
  created_at: string;
};

export type ShortformSave = {
  id: string;
  user_id: string;
  video_id: string;
  note: string | null;
  folder: string;
  created_at: string;
};

export type ShortformLike = {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
};

export type ShortformGenerateRequest = {
  lecture_id?: string;
  course_id: string;
  mode?: 'single' | 'cross';
  style?: ShortformStyle;
  target_duration_sec?: number;
  language?: string;
};

export type ShortformSelectRequest = {
  candidate_ids: string[];
  is_selected: boolean;
};

export type ShortformComposeRequest = {
  extraction_id: string;
  title: string;
  candidate_ids?: string[];
  description?: string;
};

export type ShortformShareRequest = {
  video_id: string;
  course_id: string;
  visibility?: 'course';
  message?: string;
};

export type ShortformSaveRequest = {
  video_id: string;
  note?: string;
  folder?: string;
};

export type ShortformLikeRequest = {
  video_id: string;
};

export type ShortformExtractionDetail = ShortformExtraction & {
  candidates: ShortformCandidate[];
};

export type ShortformVideoDetail = ShortformVideo & {
  clips: ShortformClip[];
};

export type ShortformCommunityItem = ShortformVideoDetail & {
  shared_by_name: string;
  course_title: string;
  is_saved: boolean;
  is_liked: boolean;
};

export type ShortformLibraryItem = ShortformVideoDetail & {
  ownership: 'owned' | 'saved';
  save_note?: string | null;
  save_folder?: string;
  saved_at?: string;
};
