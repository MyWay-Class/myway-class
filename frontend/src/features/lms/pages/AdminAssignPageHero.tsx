export function AdminAssignPageHero() {
  return (
    <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-5 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
        <i className="ri-links-line" />
        배정 운영
      </div>
      <h2 className="mt-3 text-[22px] font-extrabold tracking-[-0.03em] text-slate-900">강사/수강생 배정 상세</h2>
      <p className="mt-1 text-[13px] text-slate-600">강의별 담당 교강사와 수강생 그룹 분포를 한 번에 확인합니다.</p>
    </section>
  );
}
