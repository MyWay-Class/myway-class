import type { CourseCard, Dashboard, LectureDetail, LoginResponse } from '@myway/shared';
import { ContinueStudySection, courseVisualClasses, formatStudyHours, getPopularKeywords, HomeHero } from './HomePageSections';

type HomePageProps = {
  session: LoginResponse;
  dashboard: Dashboard | null;
  courses: CourseCard[];
  highlightedLecture: LectureDetail | null;
  onNavigate: (page: 'home' | 'dashboard' | 'courses' | 'shortform' | 'community' | 'my-shortforms' | 'ai-chat') => void;
  onSelectCourse: (courseId: string) => void;
};

export function HomePage({ session, dashboard, courses, highlightedLecture, onNavigate, onSelectCourse }: HomePageProps) {
  const averageProgress = dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const enrolledCourses = dashboard?.courses?.filter((course) => course.enrolled).length ?? 0;
  const totalLectures = courses.reduce((sum, course) => sum + course.lecture_count, 0);
  const totalCompletedLectures = courses.reduce((sum, course) => sum + course.completed_lectures, 0);
  const totalStudyMinutes = courses.reduce((sum, course) => sum + Math.round(course.total_duration_minutes * (Math.max(course.progress_percent, 0) / 100)), 0);
  const achievements = Math.max(Math.round(totalCompletedLectures / 3), 0);
  const popularKeywords = getPopularKeywords(courses);
  const continueCourse = highlightedLecture ? courses.find((course) => course.id === highlightedLecture.course_id) ?? courses[0] ?? null : courses[0] ?? null;

  return (
    <div className="space-y-6">
      <HomeHero session={session} averageProgress={averageProgress} enrolledCourses={enrolledCourses} onNavigate={onNavigate} />

      <section className="relative -mt-2 rounded-[22px] border border-cyan-200/20 bg-[linear-gradient(145deg,#0a2f56_0%,#0b3c63_45%,#11496f_100%)] p-5 text-cyan-50 shadow-[0_16px_36px_rgba(8,47,73,0.35)] lg:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)] lg:items-center">
          <div>
            <h3 className="text-[28px] font-extrabold tracking-[-0.02em]">원하는 강의를 찾아보세요</h3>
            <div className="mt-4 flex items-center rounded-2xl border border-cyan-100/30 bg-white/95 px-4 py-3 text-slate-700">
              <i className="ri-search-line text-[18px] text-slate-500" />
              <input type="text" value="강의명, 키워드, 스킬 등을 검색해보세요" readOnly className="ml-3 w-full bg-transparent text-[14px] text-slate-700 outline-none" aria-label="강의 검색" />
              <button type="button" onClick={() => onNavigate('courses')} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-cyan-600">이동</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(popularKeywords.length > 0 ? popularKeywords : ['프롬프트 엔지니어링', 'ChatGPT 활용', '파이썬']).map((tag) => (
                <button key={tag} type="button" onClick={() => onNavigate('courses')} className="rounded-full border border-cyan-100/25 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-50/95 transition hover:bg-white/20">{tag}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-4 backdrop-blur">
            <div className="text-[12px] font-semibold text-cyan-100/85">AI 맞춤 추천</div>
            <div className="mt-2 text-[15px] font-bold text-white">{session.user.name}님에게 맞는 코스</div>
            <p className="mt-1 text-[12px] leading-6 text-cyan-100/80">학습 기록과 관심 카테고리를 기반으로 오늘의 추천 강의를 준비했습니다.</p>
            <button type="button" onClick={() => onNavigate('courses')} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-cyan-200/35 bg-cyan-300/20 px-3 py-1.5 text-[12px] font-semibold text-cyan-100 transition hover:bg-cyan-300/30">추천 강의 보기<i className="ri-arrow-right-s-line" /></button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">내 학습 현황</h3>
          <button type="button" onClick={() => onNavigate('dashboard')} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 transition hover:text-cyan-900">학습 통계 전체 보기<i className="ri-arrow-right-s-line" /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="text-[12px] font-semibold text-slate-500">학습 진행률</div><div className="mt-2 text-[36px] font-black tracking-[-0.03em] text-slate-900">{averageProgress}%</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(averageProgress, 6)}%` }} /></div><div className="mt-2 text-[11px] text-slate-500">전체 진도 {totalCompletedLectures} / {Math.max(totalLectures, 0)} 강의</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="text-[12px] font-semibold text-slate-500">연속 학습일</div><div className="mt-2 flex items-end justify-between"><div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{Math.max(enrolledCourses * 3, 1)}일</div><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><i className="ri-fire-line text-[20px]" /></span></div><div className="mt-2 text-[11px] text-slate-500">최근 학습 흐름 유지 중</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="text-[12px] font-semibold text-slate-500">학습 시간</div><div className="mt-2 flex items-end justify-between"><div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{formatStudyHours(totalStudyMinutes)}</div><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600"><i className="ri-time-line text-[20px]" /></span></div><div className="mt-2 text-[11px] text-slate-500">누적 기반 환산 시간</div></div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"><div className="text-[12px] font-semibold text-slate-500">획득 배지</div><div className="mt-2 flex items-end justify-between"><div className="text-[36px] font-black tracking-[-0.03em] text-slate-900">{achievements}개</div><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><i className="ri-trophy-line text-[20px]" /></span></div><div className="mt-2 text-[11px] text-slate-500">다음 배지까지 1개</div></div>
        </div>
      </section>

      <ContinueStudySection highlightedLecture={highlightedLecture} continueCourse={continueCourse} onSelectCourse={onSelectCourse} onNavigate={onNavigate} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">추천 강의</h3>
          <button type="button" onClick={() => onNavigate('courses')} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 transition hover:text-cyan-900">전체 보기<i className="ri-arrow-right-s-line" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {courses.slice(0, 6).map((course) => (
            <button key={course.id} type="button" onClick={() => { onSelectCourse(course.id); onNavigate('courses'); }} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`relative h-32 bg-gradient-to-br ${courseVisualClasses(course.thumbnail_palette)}`}><div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{course.difficulty === 'advanced' ? 'BEST' : 'NEW'}</div><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" /><div className="absolute bottom-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{course.category}</div></div>
              <div className="space-y-2 px-3 py-3"><div className="line-clamp-1 text-[15px] font-bold tracking-[-0.02em] text-slate-900">{course.title}</div><div className="line-clamp-1 text-[12px] text-slate-500">{course.description}</div><div className="flex items-center gap-2 text-[11px] text-slate-500"><span className="rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">{course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}</span><span>{Math.max(course.total_duration_minutes, 0) > 60 ? `${Math.round(course.total_duration_minutes / 60)}시간` : `${course.total_duration_minutes}분`}</span></div><div className="flex items-center gap-2 text-[11px] text-slate-500"><span>★ {Number.isFinite(course.rating) ? course.rating.toFixed(1) : '4.8'}</span><span>수강 {Number.isFinite(course.student_count) ? course.student_count : 0}</span></div></div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
