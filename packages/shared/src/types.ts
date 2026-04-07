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

export type CourseCard = Course & {
  instructor_name: string;
  lecture_count: number;
  enrolled: boolean;
  progress_percent: number;
  completed_lectures: number;
};

export type CourseDetail = CourseCard & {
  lectures: Lecture[];
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
