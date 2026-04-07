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

export const roleLabels: Record<UserRole, string> = {
  STUDENT: '수강생',
  INSTRUCTOR: '강사',
  ADMIN: '운영자',
};

export const rolePermissions: Record<UserRole, string[]> = {
  STUDENT: ['COURSE_VIEW', 'LECTURE_VIEW', 'ENROLL', 'PROGRESS_READ'],
  INSTRUCTOR: ['COURSE_VIEW', 'LECTURE_VIEW', 'COURSE_MANAGE', 'LECTURE_MANAGE', 'PROGRESS_READ'],
  ADMIN: ['COURSE_VIEW', 'LECTURE_VIEW', 'COURSE_MANAGE', 'LECTURE_MANAGE', 'ENROLL_MANAGE', 'PROGRESS_READ', 'USER_MANAGE'],
};

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type EnrollmentStatus = 'active' | 'paused' | 'completed';

export type LectureContentType = 'video' | 'text';

export const demoUsers: AuthUser[] = [
  {
    id: 'usr_std_001',
    name: '데모 수강생',
    email: 'student@mywayclass.local',
    role: 'STUDENT',
    department: '학습자',
    bio: '강의 숏폼과 커스텀 강의를 활용해 복습 효율을 높이고 싶은 수강생입니다.',
  },
  {
    id: 'usr_inst_001',
    name: '김민준',
    email: 'instructor1@mywayclass.local',
    role: 'INSTRUCTOR',
    department: 'AI 교육학부',
    bio: '학습 데이터를 기반으로 더 나은 강의를 설계하는 강사입니다.',
  },
  {
    id: 'usr_admin_001',
    name: '오운영',
    email: 'admin@mywayclass.local',
    role: 'ADMIN',
    department: '교육 운영팀',
    bio: '수강 흐름과 운영 데이터를 관리하는 운영자입니다.',
  },
];

export function getDemoUser(userId: string): AuthUser | undefined {
  return demoUsers.find((user) => user.id === userId);
}

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function getPermissions(role: UserRole): string[] {
  return rolePermissions[role];
}

export function canEnroll(role: UserRole): boolean {
  return role === 'STUDENT' || role === 'ADMIN';
}

export function canManageCourses(role: UserRole): boolean {
  return role === 'INSTRUCTOR' || role === 'ADMIN';
}

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

export type Dashboard = {
  learner_name: string;
  role: UserRole;
  total_courses: number;
  active_enrollments: number;
  average_progress: number;
  courses: CourseCard[];
};

type InstructorMap = Record<string, string>;

export const instructorNames: InstructorMap = {
  usr_inst_001: '김민준',
  usr_inst_002: '이서연',
};

export const demoCourses: Course[] = [
  {
    id: 'crs_ai_001',
    instructor_id: 'usr_inst_001',
    title: 'AI 기초와 학습 데이터 이해',
    description: 'AI의 기본 개념과 학습 데이터 구조를 함께 익히는 입문 과정입니다.',
    category: 'AI',
    difficulty: 'beginner',
    is_published: true,
    tags: ['AI', '기초', '데이터'],
  },
  {
    id: 'crs_web_001',
    instructor_id: 'usr_inst_002',
    title: 'React와 TypeScript로 만드는 실전 웹앱',
    description: '화면 구성, 상태 관리, API 연결을 다루는 웹 개발 과정입니다.',
    category: 'Web',
    difficulty: 'intermediate',
    is_published: true,
    tags: ['React', 'TypeScript', 'Web'],
  },
  {
    id: 'crs_llm_001',
    instructor_id: 'usr_inst_001',
    title: 'RAG와 프롬프트로 만드는 학습 도우미',
    description: '강의 검색, 요약, 질문응답을 연결하는 AI 학습 보조 과정을 다룹니다.',
    category: 'AI',
    difficulty: 'advanced',
    is_published: true,
    tags: ['RAG', 'LLM', '프롬프트'],
  },
];

export const demoLectures: Lecture[] = [
  {
    id: 'lec_ai_001',
    course_id: 'crs_ai_001',
    title: 'AI란 무엇인가',
    order_index: 0,
    content_type: 'video',
    content_text: 'AI의 정의와 역사, 머신러닝과 딥러닝의 관계를 살펴봅니다.',
    duration_minutes: 18,
    is_published: true,
  },
  {
    id: 'lec_ai_002',
    course_id: 'crs_ai_001',
    title: '학습 데이터와 모델의 관계',
    order_index: 1,
    content_type: 'video',
    content_text: '데이터셋 구성, 라벨링, 검증 데이터의 역할을 다룹니다.',
    duration_minutes: 22,
    is_published: true,
  },
  {
    id: 'lec_web_001',
    course_id: 'crs_web_001',
    title: 'React 컴포넌트 구조',
    order_index: 0,
    content_type: 'video',
    content_text: '함수형 컴포넌트와 상태 흐름, props 전달을 설명합니다.',
    duration_minutes: 25,
    is_published: true,
  },
  {
    id: 'lec_web_002',
    course_id: 'crs_web_001',
    title: 'TypeScript와 폼 처리',
    order_index: 1,
    content_type: 'video',
    content_text: '폼 검증과 타입 안정성을 함께 유지하는 방법을 소개합니다.',
    duration_minutes: 24,
    is_published: true,
  },
  {
    id: 'lec_llm_001',
    course_id: 'crs_llm_001',
    title: 'RAG 파이프라인 설계',
    order_index: 0,
    content_type: 'video',
    content_text: '청킹, 임베딩, 검색, 생성의 연결 구조를 설명합니다.',
    duration_minutes: 30,
    is_published: true,
  },
  {
    id: 'lec_llm_002',
    course_id: 'crs_llm_001',
    title: '강의 요약과 질문응답 연결',
    order_index: 1,
    content_type: 'video',
    content_text: '강의 요약과 챗봇 응답을 하나의 학습 흐름으로 묶는 방법을 다룹니다.',
    duration_minutes: 28,
    is_published: true,
  },
];

export let demoEnrollments: Enrollment[] = [
  {
    id: 'enr_001',
    user_id: 'usr_std_001',
    course_id: 'crs_ai_001',
    status: 'active',
    progress_percent: 50,
  },
  {
    id: 'enr_002',
    user_id: 'usr_std_001',
    course_id: 'crs_llm_001',
    status: 'active',
    progress_percent: 20,
  },
];

export let demoLectureProgress: LectureProgress[] = [
  { id: 'prg_001', user_id: 'usr_std_001', lecture_id: 'lec_ai_001', is_completed: true },
  { id: 'prg_002', user_id: 'usr_std_001', lecture_id: 'lec_ai_002', is_completed: false },
  { id: 'prg_003', user_id: 'usr_std_001', lecture_id: 'lec_llm_001', is_completed: false },
  { id: 'prg_004', user_id: 'usr_std_001', lecture_id: 'lec_llm_002', is_completed: false },
];

export function getLectureInstructorName(instructorId: string): string {
  return getDemoUser(instructorId)?.name ?? instructorNames[instructorId] ?? '알 수 없는 강사';
}

export function getCourseLectures(courseId: string): Lecture[] {
  return demoLectures
    .filter((lecture) => lecture.course_id === courseId)
    .sort((a, b) => a.order_index - b.order_index);
}

export function isEnrolled(userId: string, courseId: string): boolean {
  return demoEnrollments.some(
    (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId && enrollment.status === 'active',
  );
}

export function getCompletedLectureCount(userId: string, courseId: string): number {
  const lectureIds = new Set(getCourseLectures(courseId).map((lecture) => lecture.id));

  return demoLectureProgress.filter(
    (progress) => progress.user_id === userId && progress.is_completed && lectureIds.has(progress.lecture_id),
  ).length;
}

export function getLectureCount(courseId: string): number {
  return getCourseLectures(courseId).length;
}

export function getCourseProgress(userId: string, courseId: string): number {
  const lectureCount = getLectureCount(courseId);
  if (lectureCount === 0) {
    return 0;
  }

  const completed = getCompletedLectureCount(userId, courseId);
  return Math.round((completed / lectureCount) * 100);
}

export function createCourseCard(course: Course, userId: string): CourseCard {
  return {
    ...course,
    instructor_name: getLectureInstructorName(course.instructor_id),
    lecture_count: getLectureCount(course.id),
    enrolled: isEnrolled(userId, course.id),
    progress_percent: getCourseProgress(userId, course.id),
    completed_lectures: getCompletedLectureCount(userId, course.id),
  };
}

export function listCourseCards(userId: string): CourseCard[] {
  return demoCourses.map((course) => createCourseCard(course, userId));
}

export function getCourseDetail(courseId: string, userId: string): CourseDetail | undefined {
  const course = demoCourses.find((item) => item.id === courseId);
  if (!course) {
    return undefined;
  }

  return {
    ...createCourseCard(course, userId),
    lectures: getCourseLectures(courseId),
  };
}

export function getLectureDetail(lectureId: string, userId?: string): LectureDetail | undefined {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return undefined;
  }

  const lectures = getCourseLectures(lecture.course_id);
  const index = lectures.findIndex((item) => item.id === lecture.id);

  return {
    ...lecture,
    course_title: demoCourses.find((item) => item.id === lecture.course_id)?.title ?? '알 수 없는 강의',
    course_instructor:
      getLectureInstructorName(demoCourses.find((item) => item.id === lecture.course_id)?.instructor_id ?? ''),
    previous_lecture_id: index > 0 ? lectures[index - 1]?.id : undefined,
    next_lecture_id: index >= 0 && index < lectures.length - 1 ? lectures[index + 1]?.id : undefined,
    is_completed: userId
      ? demoLectureProgress.some((progress) => progress.user_id === userId && progress.lecture_id === lectureId && progress.is_completed)
      : undefined,
  };
}

export function completeLectureProgress(userId: string, lectureId: string): LectureCompletionResult {
  const lecture = demoLectures.find((item) => item.id === lectureId);
  if (!lecture) {
    return { ok: false, reason: 'lecture_not_found' };
  }

  const enrollment = demoEnrollments.find(
    (item) => item.user_id === userId && item.course_id === lecture.course_id && item.status === 'active',
  );

  if (!enrollment) {
    return { ok: false, reason: 'enrollment_required' };
  }

  const existingProgress = demoLectureProgress.find(
    (progress) => progress.user_id === userId && progress.lecture_id === lectureId,
  );

  if (existingProgress) {
    existingProgress.is_completed = true;
  } else {
    demoLectureProgress = [
      ...demoLectureProgress,
      {
        id: `prg_${String(demoLectureProgress.length + 1).padStart(3, '0')}`,
        user_id: userId,
        lecture_id: lectureId,
        is_completed: true,
      },
    ];
  }

  const courseLectures = getCourseLectures(lecture.course_id);
  const completedLectureIds = new Set(
    demoLectureProgress
      .filter((progress) => progress.user_id === userId && progress.is_completed)
      .map((progress) => progress.lecture_id),
  );

  const completedLectures = courseLectures.filter((item) => completedLectureIds.has(item.id)).length;
  const totalLectures = courseLectures.length;
  const progressPercent = totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100);

  enrollment.progress_percent = progressPercent;

  return {
    ok: true,
    lecture_id: lectureId,
    course_id: lecture.course_id,
    progress_percent: progressPercent,
    completed_lectures: completedLectures,
    total_lectures: totalLectures,
  };
}

export function getDashboard(userId: string): Dashboard {
  const courses = listCourseCards(userId);
  const activeEnrollments = courses.filter((course) => course.enrolled).length;
  const user = getDemoUser(userId);
  const averageProgress = courses.length === 0
    ? 0
    : Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / courses.length);

  return {
    learner_name: user?.name ?? '학습자',
    role: user?.role ?? 'STUDENT',
    total_courses: courses.length,
    active_enrollments: activeEnrollments,
    average_progress: averageProgress,
    courses,
  };
}

export function enrollUser(userId: string, courseId: string): Enrollment {
  const existing = demoEnrollments.find(
    (enrollment) => enrollment.user_id === userId && enrollment.course_id === courseId,
  );

  if (existing) {
    return existing;
  }

  const enrollment: Enrollment = {
    id: `enr_${String(demoEnrollments.length + 1).padStart(3, '0')}`,
    user_id: userId,
    course_id: courseId,
    status: 'active',
    progress_percent: 0,
  };

  demoEnrollments = [...demoEnrollments, enrollment];
  return enrollment;
}
