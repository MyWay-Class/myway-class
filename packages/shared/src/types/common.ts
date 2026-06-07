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
