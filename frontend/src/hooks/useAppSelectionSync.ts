import { useEffect } from 'react';
import type { CourseCard, CourseDetail, LectureDetail, LoginResponse } from '@myway/shared';
import { loadCourseDetail, loadLectureDetail } from '../lib/api';

type SelectionDeps = {
  courseCards: CourseCard[];
  selectedCourseId: string;
  selectedCourse: CourseDetail | null;
  selectedLectureId: string;
  session: LoginResponse | null;
  setSelectedCourse: (v: CourseDetail | null) => void;
  setSelectedCourseId: (v: string) => void;
  setSelectedLectureId: (v: string) => void;
  setSelectedLecture: (v: LectureDetail | null) => void;
};

export function useAppSelectionSync({
  courseCards,
  selectedCourseId,
  selectedCourse,
  selectedLectureId,
  session,
  setSelectedCourse,
  setSelectedCourseId,
  setSelectedLectureId,
  setSelectedLecture,
}: SelectionDeps) {
  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourse(null);
      setSelectedLectureId('');
      return;
    }
    let active = true;
    async function run() {
      const course = await loadCourseDetail(selectedCourseId, session?.session_token);
      if (!active) return;
      if (!course) {
        const fallbackCourseId = courseCards[0]?.id ?? '';
        if (fallbackCourseId && fallbackCourseId !== selectedCourseId) {
          setSelectedCourseId(fallbackCourseId);
          return;
        }
      }
      setSelectedCourse(course);
      setSelectedLectureId(course?.lectures[0]?.id ?? '');
    }
    void run();
    return () => {
      active = false;
    };
  }, [courseCards, selectedCourseId, session?.session_token, setSelectedCourse, setSelectedCourseId, setSelectedLectureId]);

  useEffect(() => {
    if (!selectedLectureId) {
      setSelectedLecture(null);
      return;
    }
    if (selectedCourse) {
      const exists = selectedCourse.lectures.some((lecture) => lecture.id === selectedLectureId);
      if (!exists) {
        const fallbackLectureId = selectedCourse.lectures[0]?.id ?? '';
        if (fallbackLectureId && fallbackLectureId !== selectedLectureId) setSelectedLectureId(fallbackLectureId);
        else setSelectedLecture(null);
        return;
      }
    }
    let active = true;
    async function run() {
      const lecture = await loadLectureDetail(selectedLectureId, session?.session_token);
      if (!active) return;
      setSelectedLecture(lecture);
    }
    void run();
    return () => {
      active = false;
    };
  }, [selectedCourse, selectedLectureId, session?.session_token, setSelectedLecture, setSelectedLectureId]);
}
