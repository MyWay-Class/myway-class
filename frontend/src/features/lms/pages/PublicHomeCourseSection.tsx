import type { CourseCard } from '@myway/shared';
import { CourseExploreFilters } from '../components/CourseExploreFilters';

type PublicHomeCourseSectionProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  activeStatus: 'all' | 'available' | 'enrolled';
  onStatusChange: (value: 'all' | 'available' | 'enrolled') => void;
  resultCount: number;
  featuredCourses: CourseCard[];
  onOpenLogin: () => void;
};

function thumbnailGradient(palette: CourseCard['thumbnail_palette']) {
  if (palette === 'emerald') return 'from-emerald-900 via-emerald-700 to-teal-500';
  if (palette === 'violet') return 'from-violet-950 via-purple-700 to-fuchsia-500';
  if (palette === 'amber') return 'from-amber-950 via-amber-700 to-orange-400';
  return 'from-blue-950 via-cyan-800 to-sky-500';
}

export function PublicHomeCourseSection({
  categories,
  activeCategory,
  onCategoryChange,
  activeStatus,
  onStatusChange,
  resultCount,
  featuredCourses,
  onOpenLogin,
}: PublicHomeCourseSectionProps) {
  return (
    <section className="space-y-4">
      <CourseExploreFilters
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        activeStatus={activeStatus}
        onStatusChange={onStatusChange}
        resultCount={resultCount}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-slate-900">추천 강의</h2>
        <button type="button" onClick={onOpenLogin} className="inline-flex items-center gap-1 text-[12px] font-semibold text-cyan-700 hover:text-cyan-900">
          전체 보기
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {featuredCourses.length > 0 ? (
          featuredCourses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={onOpenLogin}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`relative h-32 bg-gradient-to-br ${thumbnailGradient(course.thumbnail_palette)}`}>
                <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {course.difficulty === 'advanced' ? 'BEST' : 'NEW'}
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
                <div className="absolute bottom-3 right-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{course.category}</div>
              </div>
              <div className="space-y-2 px-3 py-3">
                <div className="line-clamp-1 text-[15px] font-bold tracking-[-0.02em] text-slate-900">{course.title}</div>
                <div className="line-clamp-1 text-[12px] text-slate-500">{course.description}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="rounded-full bg-cyan-50 px-2 py-0.5 font-semibold text-cyan-700">
                    {course.difficulty === 'beginner' ? '입문' : course.difficulty === 'intermediate' ? '중급' : '고급'}
                  </span>
                  <span>{Math.max(course.total_duration_minutes, 0) > 60 ? `${Math.round(course.total_duration_minutes / 60)}시간` : `${course.total_duration_minutes}분`}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>★ {Number.isFinite(course.rating) ? course.rating.toFixed(1) : '4.8'}</span>
                  <span>수강 {Number.isFinite(course.student_count) ? course.student_count : 0}</span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-5 rounded-3xl border border-slate-200 bg-white px-5 py-8 text-center text-[13px] leading-6 text-slate-500 shadow-sm">
            검색 결과가 없습니다. 검색어, 카테고리, 수강 상태를 바꿔 보세요.
          </div>
        )}
      </div>
    </section>
  );
}
