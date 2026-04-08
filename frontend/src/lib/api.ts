import {
  canEnroll,
  completeLectureProgress,
  getAIInsightsForUser,
  getAIRecommendationsForUser,
  getAIUserSettings,
  enrollUser,
  getCourseDetail,
  getDashboard,
  getDemoUser,
  getLectureDetail,
  getPermissions,
  getRoleLabel,
  updateAIUserSettings,
  type Material,
  type MaterialCreateRequest,
  type ApiResponse,
  type AIInsights,
  type AIRecommendationOverview,
  type AIUserSettings,
  type AIUserSettingsUpdateRequest,
  type CourseCard,
  type CourseDetail,
  type Dashboard,
  type LectureDetail,
  type LoginResponse,
  type Notice,
  type NoticeCreateRequest,
  type SmartChatRequest,
  type SmartChatResult,
} from '@myway/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
const AUTH_STORAGE_KEY = 'mywayclass.auth';

function readStoredAuth(): LoginResponse | null {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    return value ? (JSON.parse(value) as LoginResponse) : null;
  } catch {
    return null;
  }
}

export function getStoredAuth(): LoginResponse | null {
  return readStoredAuth();
}

export function storeAuth(auth: LoginResponse): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getFallbackUserId(userId?: string | null): string {
  const storedAuth = readStoredAuth();

  if (storedAuth?.user) {
    return storedAuth.user.id;
  }

  if (userId && getDemoUser(userId)) {
    return userId;
  }

  return 'guest';
}

async function request<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<ApiResponse<T> | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

function unwrap<T>(response: ApiResponse<T> | null, fallback: () => T): T {
  if (response?.success && response.data !== undefined) {
    return response.data;
  }

  return fallback();
}

export async function loadCurrentSession(): Promise<LoginResponse | null> {
  const storedAuth = readStoredAuth();

  if (!storedAuth) {
    return null;
  }

  const response = await request<LoginResponse>('/api/v1/auth/me', undefined, storedAuth.session_token);

  if (response?.success && response.data) {
    storeAuth(response.data);
    return response.data;
  }

  return storedAuth;
}

export async function loginWithUser(userId: string): Promise<LoginResponse | null> {
  const response = await request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

  if (response?.success && response.data) {
    storeAuth(response.data);
    return response.data;
  }

  const fallbackUser = getDemoUser(userId);
  if (!fallbackUser) {
    return null;
  }

  const fallbackAuth: LoginResponse = {
    session_token: `local-${fallbackUser.id}`,
    user: fallbackUser,
    permissions: getPermissions(fallbackUser.role),
  };

  storeAuth(fallbackAuth);
  return fallbackAuth;
}

export async function logoutCurrentSession(sessionToken?: string | null): Promise<void> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (token) {
    await request('/api/v1/auth/logout', { method: 'POST' }, token);
  }

  clearStoredAuth();
}

type BackendHealth = {
  status: string;
  service: string;
  timestamp: string;
};

export async function loadBackendHealth(): Promise<boolean> {
  const response = await request<BackendHealth>('/api/v1/health');
  return Boolean(response?.success && response.data?.status === 'ok');
}

export async function loadDashboard(sessionToken?: string | null): Promise<Dashboard | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Dashboard>(`/api/v1/dashboard`, undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getDashboard(userId);
}

export async function loadAIInsights(sessionToken?: string | null): Promise<AIInsights | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIInsights>('/api/v1/ai/insights', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIInsightsForUser(userId);
}

export async function loadAIRecommendations(sessionToken?: string | null): Promise<AIRecommendationOverview | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIRecommendationOverview>('/api/v1/ai/recommendations', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIRecommendationsForUser(userId);
}

export async function loadAISettings(sessionToken?: string | null): Promise<AIUserSettings | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIUserSettings>('/api/v1/ai/settings', undefined, token);
  const userId = getFallbackUserId();

  return response?.success && response.data ? response.data : getAIUserSettings(userId);
}

export async function saveAISettings(
  input: AIUserSettingsUpdateRequest,
  sessionToken?: string | null,
): Promise<AIUserSettings | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<AIUserSettings>(
    '/api/v1/ai/settings',
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
    token,
  );

  const userId = getFallbackUserId();
  return response?.success && response.data ? response.data : updateAIUserSettings(userId, input);
}

export async function loadCourses(sessionToken?: string | null): Promise<CourseCard[]> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseCard[]>(`/api/v1/courses?userId=${encodeURIComponent(userId)}`, undefined, token);
  return unwrap(response, () => getDashboard(userId).courses);
}

export async function loadCourseDetail(
  courseId: string,
  sessionToken?: string | null,
): Promise<CourseDetail | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<CourseDetail>(
    `/api/v1/courses/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId)}`,
    undefined,
    token,
  );
  const fallback = getCourseDetail(courseId, userId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function loadLectureDetail(lectureId: string, sessionToken?: string | null): Promise<LectureDetail | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const userId = getFallbackUserId();
  const response = await request<LectureDetail>(`/api/v1/lectures/${encodeURIComponent(lectureId)}`, undefined, token);
  const fallback = getLectureDetail(lectureId, userId);
  return response?.success && response.data ? response.data : fallback ?? null;
}

export async function loadCourseMaterials(courseId: string, sessionToken?: string | null): Promise<Material[]> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const response = await request<Material[]>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/materials`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : [];
}

export async function loadCourseNotices(courseId: string, sessionToken?: string | null): Promise<Notice[]> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const response = await request<Notice[]>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/notices`,
    undefined,
    token,
  );
  return response?.success && response.data ? response.data : [];
}

export async function createCourseMaterial(
  courseId: string,
  input: MaterialCreateRequest,
  sessionToken?: string | null,
): Promise<Material | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Material>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/materials`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

export async function createCourseNotice(
  courseId: string,
  input: NoticeCreateRequest,
  sessionToken?: string | null,
): Promise<Notice | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<Notice>(
    `/api/v1/courses/${encodeURIComponent(courseId)}/notices`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}

type CompleteLectureResponse = {
  lecture_id: string;
  course_id: string;
  progress_percent: number;
  completed_lectures: number;
  total_lectures: number;
};

export async function completeLecture(
  lectureId: string,
  sessionToken?: string | null,
): Promise<CompleteLectureResponse | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<CompleteLectureResponse>(
    `/api/v1/lectures/${encodeURIComponent(lectureId)}/complete`,
    { method: 'POST' },
    token,
  );

  if (response?.success && response.data) {
    return response.data;
  }

  const storedAuth = readStoredAuth();
  const userId = storedAuth?.user.id;

  if (!userId) {
    return null;
  }

  const fallback = completeLectureProgress(userId, lectureId);
  if (!fallback.ok) {
    return null;
  }

  return {
    lecture_id: fallback.lecture_id,
    course_id: fallback.course_id,
    progress_percent: fallback.progress_percent,
    completed_lectures: fallback.completed_lectures,
    total_lectures: fallback.total_lectures,
  };
}

export async function enrollCourse(
  courseId: string,
  sessionToken?: string | null,
): Promise<{ enrollmentId: string; course: CourseDetail | null } | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;
  const storedAuth = readStoredAuth();
  const userId = storedAuth?.user.id ?? 'usr_std_001';

  if (!token) {
    return null;
  }

  const response = await request<{ enrollmentId: string; course: CourseDetail | null }>(
    '/api/v1/enrollments',
    {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    },
    token,
  );

  if (response?.success && response.data) {
    return response.data;
  }

  const enrollment = enrollUser(userId, courseId);

  return {
    enrollmentId: enrollment.id,
    course: getCourseDetail(courseId, userId) ?? null,
  };
}

export function canCurrentUserEnroll(): boolean {
  const storedAuth = readStoredAuth();
  return storedAuth ? canEnroll(storedAuth.user.role) : false;
}

export function getCurrentRoleLabel(): string {
  const storedAuth = readStoredAuth();
  return storedAuth ? getRoleLabel(storedAuth.user.role) : '게스트';
}

export async function sendSmartChat(
  input: SmartChatRequest,
  sessionToken?: string | null,
): Promise<SmartChatResult | null> {
  const token = sessionToken ?? readStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<SmartChatResult>(
    '/api/v1/smart/chat',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}
