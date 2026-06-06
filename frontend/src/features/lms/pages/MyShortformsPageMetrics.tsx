export function MyShortformsMetrics({
  customCoursesCount,
  ownedVideosCount,
  savedVideosCount,
  copiedCoursesCount,
}: {
  customCoursesCount: number;
  ownedVideosCount: number;
  savedVideosCount: number;
  copiedCoursesCount: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{customCoursesCount}</div><div className="mt-1 text-[12px] text-slate-500">개인 코스</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{ownedVideosCount}</div><div className="mt-1 text-[12px] text-slate-500">내 숏폼</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{savedVideosCount}</div><div className="mt-1 text-[12px] text-slate-500">저장 숏폼</div></article>
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5"><div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{copiedCoursesCount}</div><div className="mt-1 text-[12px] text-slate-500">복사 코스</div></article>
    </section>
  );
}
