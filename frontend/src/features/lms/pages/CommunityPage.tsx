import type { AIRecommendationOverview, CourseCard } from '@myway/shared';

type CommunityPageProps = {
  courses: CourseCard[];
  recommendations: AIRecommendationOverview | null;
};

export function CommunityPage({ courses, recommendations }: CommunityPageProps) {
  const items = recommendations?.recommendations.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    course: item.category,
    author: item.instructor_name,
  })) ?? courses.slice(0, 3).map((course) => ({
    id: course.id,
    title: course.title,
    course: course.category,
    author: course.instructor_name,
  }));

  return (
    <div className="space-y-5">
      <section className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">숏폼 커뮤니티</h2>
          <p className="mt-1 text-[12px] text-slate-500">인기 학습 클립과 재구성 콘텐츠를 둘러보는 커뮤니티 뷰입니다.</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">인기</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">최신</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="aspect-video bg-[linear-gradient(135deg,#1e293b,#475569)]" />
            <div className="px-5 py-4">
              <div className="text-[14px] font-semibold text-slate-900">{item.title}</div>
              <div className="mt-1 text-[12px] text-slate-500">{item.course}</div>
              <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
                <span>{item.author}</span>
                <span className="flex items-center gap-1">
                  <i className="ri-heart-3-line" />
                  12
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
