import type {
  AILogOverview,
  AIInsights,
  AIProviderCatalog,
  AIRecommendationOverview,
  AIUserSettings,
  AuthUser,
  CourseCard,
  CourseCreateRequest,
  CourseDetail,
  Dashboard,
  LectureDetail,
  LoginResponse,
  UserRole,
} from '@myway/shared';

export type LmsPageId =
  | 'dashboard'
  | 'courses'
  | 'lecture-watch'
  | 'my-courses'
  | 'course-create'
  | 'lecture-studio'
  | 'shortform'
  | 'community'
  | 'my-shortforms'
  | 'ai-chat'
  | 'media-pipeline'
  | 'quiz-gen'
  | 'ai-summary'
  | 'assignment-check'
  | 'admin-users'
  | 'admin-instructors'
  | 'admin-assign'
  | 'admin-stats'
  | 'admin-automation';

export type LmsNavKey = LmsPageId | 'lecture-watch' | 'shortform-wizard' | 'admin-user-detail';

export type LmsNavItem = {
  page: LmsPageId;
  aliases?: LmsNavKey[];
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
  aiLogs: AILogOverview | null;
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
  onCreateCourse: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  selectedCourse: CourseDetail | null;
  selectedCourseId: string;
  selectedLectureId: string;
  activeNavKey?: LmsNavKey;
  session: LoginResponse | null;
};

export type RoleTone = 'student' | 'instructor' | 'admin';

export function toRoleTone(role: UserRole): RoleTone {
  if (role === 'ADMIN') return 'admin';
  if (role === 'INSTRUCTOR') return 'instructor';
  return 'student';
}
