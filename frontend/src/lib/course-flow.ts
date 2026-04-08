import type { CourseDetail, LectureDetail, LoginResponse } from '@myway/shared';
import {
  completeLecture,
  createCourseMaterial,
  createCourseNotice,
  loadCourseDetail,
  loadLectureDetail,
} from './api';

type FlowDeps = {
  session: LoginResponse | null;
  selectedCourse: CourseDetail | null;
  selectedCourseId: string;
  canManageCurrent: boolean;
  setBusy: (busy: boolean) => void;
  setNotice: (notice: string) => void;
  setSelectedCourse: (course: CourseDetail | null) => void;
  setSelectedLecture: (lecture: LectureDetail | null) => void;
  refreshLearningState: (session: LoginResponse | null) => Promise<void>;
};

export async function completeLectureFlow(
  deps: FlowDeps,
  lectureId: string,
): Promise<boolean> {
  const {
    session,
    selectedCourse,
    selectedCourseId,
    setBusy,
    setNotice,
    setSelectedCourse,
    setSelectedLecture,
    refreshLearningState,
  } = deps;

  if (!session) {
    setNotice('강의 완료는 로그인 후 사용할 수 있습니다.');
    return false;
  }

  if (!selectedCourse?.enrolled) {
    setNotice('수강 신청 후에 진도를 저장할 수 있습니다.');
    return false;
  }

  if (!selectedCourse) {
    return false;
  }

  setBusy(true);

  try {
    const result = await completeLecture(lectureId, session.session_token);

    if (!result) {
      setNotice('강의 진도 저장에 실패했습니다.');
      return false;
    }

    await refreshLearningState(session);

    const refreshedCourse = await loadCourseDetail(selectedCourseId, session.session_token);
    setSelectedCourse(refreshedCourse);

    const refreshedLecture = await loadLectureDetail(lectureId, session.session_token);
    setSelectedLecture(refreshedLecture);

    setNotice(`진도가 ${result.progress_percent}%로 저장되었습니다.`);
    return true;
  } finally {
    setBusy(false);
  }
}

export async function addCourseMaterialFlow(
  deps: FlowDeps,
  input: { title: string; summary: string; file_name: string },
): Promise<boolean> {
  const {
    session,
    selectedCourse,
    selectedCourseId,
    canManageCurrent,
    setBusy,
    setNotice,
    setSelectedCourse,
  } = deps;

  if (!session || !selectedCourse) {
    setNotice('자료 등록 전에 강의를 선택하고 로그인해 주세요.');
    return false;
  }

  if (!canManageCurrent) {
    setNotice('자료는 강사와 운영자만 등록할 수 있습니다.');
    return false;
  }

  setBusy(true);

  try {
    const result = await createCourseMaterial(selectedCourse.id, input, session.session_token);

    if (!result) {
      setNotice('자료 등록에 실패했습니다.');
      return false;
    }

    const refreshedCourse = await loadCourseDetail(selectedCourseId, session.session_token);
    setSelectedCourse(refreshedCourse);
    setNotice(`자료 "${result.title}"을(를) 등록했습니다.`);
    return true;
  } finally {
    setBusy(false);
  }
}

export async function addCourseNoticeFlow(
  deps: FlowDeps,
  input: { title: string; content: string; pinned?: boolean },
): Promise<boolean> {
  const {
    session,
    selectedCourse,
    selectedCourseId,
    canManageCurrent,
    setBusy,
    setNotice,
    setSelectedCourse,
  } = deps;

  if (!session || !selectedCourse) {
    setNotice('공지 등록 전에 강의를 선택하고 로그인해 주세요.');
    return false;
  }

  if (!canManageCurrent) {
    setNotice('공지는 강사와 운영자만 등록할 수 있습니다.');
    return false;
  }

  setBusy(true);

  try {
    const result = await createCourseNotice(selectedCourse.id, input, session.session_token);

    if (!result) {
      setNotice('공지 등록에 실패했습니다.');
      return false;
    }

    const refreshedCourse = await loadCourseDetail(selectedCourseId, session.session_token);
    setSelectedCourse(refreshedCourse);
    setNotice(`공지 "${result.title}"을(를) 등록했습니다.`);
    return true;
  } finally {
    setBusy(false);
  }
}
