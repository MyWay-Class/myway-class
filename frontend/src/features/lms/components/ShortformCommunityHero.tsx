type ShortformCommunityHeroProps = {
  totalItems: number;
  totalClips: number;
  totalViews: number;
};

export function ShortformCommunityHero({ totalItems, totalClips, totalViews }: ShortformCommunityHeroProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-5 py-5 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
            <i className="ri-film-line" />
            숏폼 커뮤니티
          </div>
          <h2 className="mt-4 text-[24px] font-extrabold tracking-[-0.04em]">클립 구성부터 보이는 커뮤니티</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-7 text-white/75">
            카드에서 핵심 클립을 먼저 보여주고, 상세 모달에서 전체 구성과 메타데이터를 확인할 수 있게 정리했습니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[260px]">
          <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
            <div className="text-[18px] font-extrabold">{totalItems}</div>
            <div className="text-[11px] text-white/65">항목</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
            <div className="text-[18px] font-extrabold">{totalClips}</div>
            <div className="text-[11px] text-white/65">클립</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
            <div className="text-[18px] font-extrabold">{totalViews}</div>
            <div className="text-[11px] text-white/65">조회</div>
          </div>
        </div>
      </div>
    </section>
  );
}
