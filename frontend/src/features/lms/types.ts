import type {
  AIInsights,
  AIProviderCatalog,
  AIRecommendationOverview,
  AIUserSettings,
  AuthUser,
  CourseCard,
  CourseDetail,
  Dashboard,
  LectureDetail,
  LoginResponse,
  UserRole,
} from '@myway/shared';

export type LmsPageId =
  | 'dashboard'
  | 'courses'
  | 'shortform'
  | 'community'
  | 'my-shortforms'
  | 'ai-chat'
  | 'quiz-gen'
  | 'ai-summary'
  | 'assignment-check'
  | 'admin-users'
  | 'admin-instructors'
  | 'admin-assign'
  | 'admin-stats'
  | 'admin-automation';

export type LmsNavItem = {
  page: LmsPageId;
  icon: string;
  label: string;
  badge?: string;
};

export type LmsNavGroup = {
  label: string;
  items: LmsNavItem[];
};

export type LmsDashboardProps = {
  busy: boolean;
  canEnrollCurrent: boolean;
  canManageCurrent: boolean;
  apiStatus: 'checking' | 'online' | 'offline';
  courseCards: CourseCard[];
  dashboard: Dashboard | null;
  demoUsers: AuthUser[];
  enrolledCourses: CourseCard[];
  getCurrentRoleLabel: (session: LoginResponse | null) => string;
  highlightedLecture: LectureDetail | null;
  loading: boolean;
  notice: string;
  insights: AIInsights | null;
  providers: AIProviderCatalog | null;
  recommendations: AIRecommendationOverview | null;
  settings: AIUserSettings | null;
  onCompleteLecture: (lectureId: string) => void;
  onAddMaterial: (input: { title: string; summary: string; file_name: string }) => void;
  onAddNotice: (input: { title: string; content: string; pinned?: boolean }) => void;
  onEnroll: (courseId: string) => void;
  onLogin: (userId: string) => void;
  onLogout: () => void;
  onSaveAISettings: (input: {
    language?: 'ko' | 'en';
    theme?: 'light' | 'dark' | 'system';
    auto_summary?: boolean;
    recommendation_mode?: 'progress' | 'discovery' | 'balanced';
  }) => Promise<boolean>;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  selectedCourse: CourseDetail | null;
  selectedCourseId: string;
  selectedLectureId: string;
  session: LoginResponse | null;
};

export type RoleTone = 'student' | 'instructor' | 'admin';

export function toRoleTone(role: UserRole): RoleTone {
  if (role === 'ADMIN') return 'admin';
  if (role === 'INSTRUCTOR') return 'instructor';
  return 'student';
}
