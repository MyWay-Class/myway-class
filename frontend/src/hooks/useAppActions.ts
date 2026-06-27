import type { AIUserSettings, CourseDetail, LoginResponse } from '@myway/shared';
import { clearStoredAuth, createCourse, enrollCourse, loadLectureDetail, loginWithUser, logoutCurrentSession, saveAISettings, storeAuth } from '../lib/api';
import { refreshLearningState } from '../lib/app-state';

type LearningDeps = Parameters<typeof refreshLearningState>[0];

type UseAppActionsInput = {
  session: LoginResponse | null;
  canEnrollCurrent: boolean;
  canManageCurrent: boolean;
  setSession: (v: LoginResponse | null) => void;
  setBusy: (v: boolean) => void;
  setNotice: (v: string) => void;
  setSettings: (v: AIUserSettings | null) => void;
  setSelectedCourse: (v: CourseDetail | null) => void;
  setSelectedCourseId: (v: string) => void;
  setSelectedLectureId: (v: string) => void;
  setSelectedLecture: (v: any) => void;
  learningDeps: LearningDeps;
};

export function useAppActions(input: UseAppActionsInput) {
  const {
    session, canEnrollCurrent, canManageCurrent, setSession, setBusy, setNotice, setSettings,
    setSelectedCourse, setSelectedCourseId, setSelectedLectureId, setSelectedLecture, learningDeps,
  } = input;

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
    await refreshLearningState(learningDeps, auth);
    setBusy(false);
  }

  async function handleLogout() {
    setBusy(true);
    await logoutCurrentSession(session?.session_token);
    clearStoredAuth();
    setSession(null);
    await refreshLearningState(learningDeps, null);
    setBusy(false);
  }

  async function handleSaveAISettings(input: {
    language?: 'ko' | 'en';
    theme?: 'light' | 'dark' | 'system';
    auto_summary?: boolean;
    recommendation_mode?: 'progress' | 'discovery' | 'balanced';
  }) {
    if (!session) {
      setNotice('로그인 후 설정을 저장할 수 있습니다.');
      return false;
    }
    setBusy(true);
    const saved = await saveAISettings(input, session.session_token);
    if (!saved) {
      setNotice('AI 설정 저장에 실패했습니다.');
      setBusy(false);
      return false;
    }
    setSettings(saved);
    await refreshLearningState(learningDeps, session);
    setNotice('AI 설정이 저장되었습니다.');
    setBusy(false);
    return true;
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
    await refreshLearningState(learningDeps, session);
    if (result?.course) {
      setSelectedCourseId(result.course.id);
      setSelectedCourse(result.course);
      setSelectedLectureId(result.course.lectures[0]?.id ?? '');
      setSelectedLecture(result.course.lectures[0] ? await loadLectureDetail(result.course.lectures[0].id, session.session_token) : null);
    }
    setNotice('수강 신청이 완료되었습니다.');
    setBusy(false);
  }

  async function handleCreateCourse(input: {
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
    is_published?: boolean;
    lecture_titles: string[];
  }) {
    if (!session) {
      setNotice('강의 개설은 로그인 후 사용할 수 있습니다.');
      return null;
    }
    if (!canManageCurrent) {
      setNotice('현재 계정은 강의를 개설할 권한이 없습니다.');
      return null;
    }
    setBusy(true);
    try {
      const created = await createCourse(input, session.session_token);
      if (!created) {
        setNotice('새 강의 개설에 실패했습니다.');
        return null;
      }
      await refreshLearningState(learningDeps, session);
      setSelectedCourseId(created.id);
      setSelectedCourse(created);
      const firstLectureId = created.lectures[0]?.id ?? '';
      setSelectedLectureId(firstLectureId);
      setSelectedLecture(firstLectureId ? await loadLectureDetail(firstLectureId, session.session_token) : null);
      setNotice(`${created.title} 강의를 개설했습니다.`);
      return created;
    } finally {
      setBusy(false);
    }
  }

  return { handleLogin, handleLogout, handleSaveAISettings, handleEnroll, handleCreateCourse };
}
