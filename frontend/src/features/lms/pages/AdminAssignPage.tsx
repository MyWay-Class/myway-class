import { useEffect, useMemo, useState } from 'react';
import type { AuthUser, CourseCard } from '@myway/shared';
import { loadAdminAssignment, saveAdminAssignment } from '../../../lib/api';

type AdminAssignPageProps = {
  users: AuthUser[];
  courses: CourseCard[];
};

export function AdminAssignPage({ users, courses }: AdminAssignPageProps) {
  const students = users.filter((user) => user.role === 'STUDENT');
  const instructors = users.filter((user) => user.role === 'INSTRUCTOR');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId],
  );

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return students;
    }
    return students.filter((student) => {
      return [student.name, student.department, student.email].join(' ').toLowerCase().includes(normalized);
    });
  }, [query, students]);

  useEffect(() => {
    let mounted = true;
    if (!selectedCourse?.id) {
      setAssignedStudentIds([]);
      return () => {
        mounted = false;
      };
    }

    void loadAdminAssignment(selectedCourse.id).then((record) => {
      if (!mounted) {
        return;
      }
      setAssignedStudentIds(Array.isArray(record?.student_ids) ? record.student_ids : []);
    });

    return () => {
      mounted = false;
    };
  }, [selectedCourse?.id]);

  const assignedSet = useMemo(() => new Set(assignedStudentIds), [assignedStudentIds]);

  const toggleStudent = (studentId: string) => {
    setAssignedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }
      return [...current, studentId];
    });
  };

  const persistAssignment = async () => {
    if (!selectedCourse?.id || saving) {
      return;
    }
    setSaving(true);
    try {
      const saved = await saveAdminAssignment(selectedCourse.id, assignedStudentIds);
      if (saved) {
        setAssignedStudentIds(saved.student_ids ?? []);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
          <i className="ri-links-line" />
          배정 운영
        </div>
        <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">강사/수강생 배정 상세</h2>
        <p className="mt-1 text-[13px] text-slate-600">강의별 담당 교강사와 수강생 그룹 분포를 한 번에 확인합니다.</p>
      </section>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">강사 배정</h2>
        <p className="mt-1 text-[12px] text-slate-500">강의별 담당 교강사를 정리한 운영용 매핑 화면입니다.</p>
        <div className="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">현재 선택 강의</div>
          <div className="mt-1 text-[14px] font-bold text-slate-900">{selectedCourse?.title ?? '강의 없음'}</div>
          <div className="mt-1 text-[12px] text-slate-600">{selectedCourse?.instructor_name ?? '담당 교강사 없음'}</div>
        </div>
        <div className="mt-4 space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedCourseId(course.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                selectedCourse?.id === course.id
                  ? 'border-cyan-300 bg-cyan-50/60'
                  : 'border-slate-200 hover:border-cyan-200 hover:bg-cyan-50/30'
              }`}
            >
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <i className="ri-book-open-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{course.title}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{course.instructor_name}</div>
              </div>
              <i className="ri-arrow-right-s-line text-slate-400" />
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h2 className="text-[15px] font-bold text-slate-900">수강생 그룹</h2>
        <p className="mt-1 text-[12px] text-slate-500">운영자가 역할별 분포와 수강생 배정 대상을 빠르게 확인할 수 있습니다.</p>
        <label className="mt-4 block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">수강생 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름, 부서, 이메일"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
          />
        </label>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-slate-500">교강사</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{instructors.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-slate-500">수강생</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{students.length}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {filteredStudents.slice(0, 8).map((student) => (
            <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <i className="ri-user-line" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-900">{student.name}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{student.department}</div>
              </div>
              <button
                type="button"
                onClick={() => toggleStudent(student.id)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
              >
                {assignedSet.has(student.id) ? '배정됨' : '배정 후보'}
              </button>
            </div>
          ))}
          {filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-[12px] text-slate-500">
              검색 조건에 맞는 수강생이 없습니다.
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={persistAssignment}
            disabled={!selectedCourse?.id || saving}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '배정 저장 중...' : `선택 인원 배정 저장 (${assignedStudentIds.length})`}
          </button>
          <button
            type="button"
            onClick={() => setAssignedStudentIds([])}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
          >
            선택 초기화
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
