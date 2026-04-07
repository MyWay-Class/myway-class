import { useEffect, useMemo, useState } from 'react';
import {
  canEnroll,
  canManageCourses,
  demoUsers,
  type CourseCard,
  type CourseDetail,
  type Dashboard,
  type LectureDetail,
  type LoginResponse,
} from '@myway/shared';
import {
  clearStoredAuth,
  enrollCourse,
  getCurrentRoleLabel,
  loadCourseDetail,
  loadCourses,
  loadCurrentSession,
  loadDashboard,
  loadLectureDetail,
  loginWithUser,
  logoutCurrentSession,
  storeAuth,
} from './lib/api';
import {
  addCourseMaterialFlow,
  addCourseNoticeFlow,
  completeLectureFlow,
} from './lib/course-flow';
import { LmsDashboard } from './components/LmsDashboard';

export default function App() {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [selectedLecture, setSelectedLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('로그인 후 내 정보와 진도가 활성화됩니다.');

  const enrolledCourses = useMemo(
    () => dashboard?.courses.filter((course) => course.enrolled) ?? [],
    [dashboard],
  );

  const canEnrollCurrent = session ? canEnroll(session.user.role) : false;
  const canManageCurrent = session ? canManageCourses(session.user.role) : false;

  async function refreshLearningState(activeSession: LoginResponse | null) {
    const courses = await loadCourses(activeSession?.session_token);
    setCourseCards(courses);

    if (courses.length > 0) {
      setSelectedCourseId((current) => current || courses[0].id);
    }

    if (activeSession) {
      const dashboardData = await loadDashboard(activeSession.session_token);
      setDashboard(dashboardData);
      setNotice(`${activeSession.user.name} 님, ${activeSession.user.role} 계정으로 로그인했습니다.`);
    } else {
      setDashboard(null);
      setNotice('로그인 후 내 정보와 진도가 활성화됩니다.');
    }
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);

      const storedSession = await loadCurrentSession();

      if (!active) {
        return;
      }

      setSession(storedSession);
      await refreshLearningState(storedSession);
      setLoading(false);
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      return;
    }

    let active = true;

    async function loadSelectedCourse() {
      const course = await loadCourseDetail(selectedCourseId, session?.session_token);

      if (!active) {
        return;
      }

      setSelectedCourse(course);
      setSelectedLectureId(course?.lectures[0]?.id ?? '');
    }

    void loadSelectedCourse();

    return () => {
      active = false;
    };
  }, [selectedCourseId, session?.session_token]);

  useEffect(() => {
    if (!selectedLectureId) {
      setSelectedLecture(null);
      return;
    }

    let active = true;

    async function loadSelectedLecture() {
      const lecture = await loadLectureDetail(selectedLectureId, session?.session_token);

      if (!active) {
        return;
      }

      setSelectedLecture(lecture);
    }

    void loadSelectedLecture();

    return () => {
      active = false;
    };
  }, [selectedLectureId, session?.session_token]);

  async function handleLogin(userId: string) {
    setBusy(true);

    const auth = await loginWithUser(userId);
    if (!auth) {
      setNotice('로그인에 실패했습니다.');
      setBusy(false);
      return;
    }

    storeAuth(auth);
    setSession(auth);
    await refreshLearningState(auth);
    setBusy(false);
  }

  async function handleLogout() {
    setBusy(true);
    await logoutCurrentSession(session?.session_token);
    clearStoredAuth();
    setSession(null);
    setDashboard(null);
    await refreshLearningState(null);
    setBusy(false);
  }

  async function handleEnroll(courseId: string) {
    if (!session) {
      setNotice('수강 신청은 로그인 후 사용할 수 있습니다.');
      return;
    }

    if (!canEnrollCurrent) {
      setNotice('현재 계정은 수강 신청 권한이 없습니다.');
      return;
    }

    setBusy(true);
    const result = await enrollCourse(courseId, session.session_token);
    await refreshLearningState(session);

    if (result?.course) {
      setSelectedCourse(result.course);
      setSelectedLectureId(result.course.lectures[0]?.id ?? '');
      setSelectedLecture(
        result.course.lectures[0]
          ? await loadLectureDetail(result.course.lectures[0].id, session.session_token)
          : null,
      );
    }

    setNotice('수강 신청이 완료되었습니다.');
    setBusy(false);
  }

  const highlightedLecture = selectedLecture ?? selectedCourse?.lectures[0] ?? null;

  const courseFlowDeps = {
    session,
    selectedCourse,
    selectedCourseId,
    canManageCurrent,
    setBusy,
    setNotice,
    setSelectedCourse,
    setSelectedLecture,
    refreshLearningState,
  };
  return (
    <LmsDashboard
      busy={busy}
      canEnrollCurrent={canEnrollCurrent}
      canManageCurrent={canManageCurrent}
      courseCards={courseCards}
      dashboard={dashboard}
      demoUsers={demoUsers}
      enrolledCourses={enrolledCourses}
      getCurrentRoleLabel={getCurrentRoleLabel}
      highlightedLecture={highlightedLecture}
      loading={loading}
      notice={notice}
      onCompleteLecture={(lectureId) => void completeLectureFlow(courseFlowDeps, lectureId)}
      onAddMaterial={(input) => addCourseMaterialFlow(courseFlowDeps, input)}
      onAddNotice={(input) => addCourseNoticeFlow(courseFlowDeps, input)}
      onEnroll={(courseId) => void handleEnroll(courseId)}
      onLogin={(userId) => void handleLogin(userId)}
      onLogout={() => void handleLogout()}
      onSelectCourse={setSelectedCourseId}
      onSelectLecture={setSelectedLectureId}
      selectedCourse={selectedCourse}
      selectedCourseId={selectedCourseId}
      selectedLectureId={selectedLectureId}
      session={session}
    />
  );
}
