import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LoginResponse } from '@myway/shared';
import { loadManagedCourses } from '../../../lib/api';

type MyCoursesPageProps = {
  session: LoginResponse;
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  onSelectCourse: (courseId: string) => void;
  onNavigate: (page: 'my-courses' | 'course-create' | 'lecture-studio' | 'courses') => void;
};

export function MyCoursesPage({ session, courses, selectedCourse, onSelectCourse, onNavigate }: MyCoursesPageProps) {
  const [managedCourses, setManagedCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('내가 개설한 강의만 모아서 보고, 바로 개설 워크플로우나 제작 스튜디오로 이어갑니다.');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const result = await loadManagedCourses(session.session_token);
      if (!active) {
        return;
      }

      setManagedCourses(result);
      setLoading(false);
      setNotice(result.length > 0 ? `관리 중인 강의 ${result.length}개를 확인할 수 있습니다.` : '아직 관리 중인 강의가 없습니다.');
    }

    void load();

    return () => {
      active = false;
    };
  }, [session.session_token]);

  const currentCourses = managedCourses.length > 0
    ? managedCourses
    : courses.filter((course) => session.user.role === 'ADMIN' || course.instructor_id === session.user.id);

  const stats = useMemo(
    () => ({
      total: currentCourses.length,
      published: currentCourses.filter((course) => course.is_published).length,
      totalLectures: currentCourses.reduce((sum, course) => sum + course.lecture_count, 0),
    }),
    [currentCourses],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-indigo-200">My Courses</div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.04em]">내 강의 관리</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">
              내가 개설한 강의를 한곳에서 확인하고, 바로 개설 워크플로우나 제작 스튜디오로 이동할 수 있습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
            <div className="font-semibold text-white">{session.user.name}</div>
            <div className="mt-1">{session.user.role}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.total}</div>
          <div className="mt-1 text-[12px] text-slate-500">관리 강의 수</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.published}</div>
          <div className="mt-1 text-[12px] text-slate-500">공개 강의</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{stats.totalLectures}</div>
          <div className="mt-1 text-[12px] text-slate-500">총 차시 수</div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">내가 개설한 강의</h3>
            <p className="mt-1 text-[12px] text-slate-500">{notice}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('course-create')}
            className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
          >
            새 강의 개설
          </button>
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">내 강의 목록을 불러오는 중입니다.</div>
        ) : currentCourses.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            아직 관리 중인 강의가 없습니다. 강의 개설 워크플로우에서 새 강의를 시작해 주세요.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {currentCourses.map((course) => {
              const active = selectedCourse?.id === course.id;
              return (
                <article
                  key={course.id}
                  className={`rounded-3xl border px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${
                    active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[14px] font-bold text-slate-900">{course.title}</div>
                      <div className="mt-1 text-[12px] text-slate-500">
                        {course.category} · {course.difficulty} · {course.lecture_count}차시
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${course.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {course.is_published ? '공개' : '비공개'}
                    </span>
                  </div>

                  <p className="mt-3 text-[12px] leading-6 text-slate-600">{course.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCourse(course.id);
                        onNavigate('course-create');
                      }}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                    >
                      개설 워크플로우
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCourse(course.id);
                        onNavigate('lecture-studio');
                      }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      제작 스튜디오
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
