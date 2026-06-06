type AssignmentCheckPageHeaderProps = {
  stats: {
    pending: number;
    reviewed: number;
    flagged: number;
    averageScore: number;
  };
};

export function AssignmentCheckPageHeader({ stats }: AssignmentCheckPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)] lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
            <i className="ri-file-check-line" />
            과제 검사
          </div>
          <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
            제출 상태, 점수,
            <br />
            피드백을 한 번에 정리합니다.
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
            검토 대기, 완료, 보완 필요를 색으로 나눠 빠르게 확인하고, 바로 다음 액션으로 이어갈 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">검토 대기</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{stats.pending}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">검토 완료</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{stats.reviewed}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">보완 필요</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{stats.flagged}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">평균 점수</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{stats.averageScore}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
