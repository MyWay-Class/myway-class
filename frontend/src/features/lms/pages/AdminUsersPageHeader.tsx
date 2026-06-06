type AdminUsersPageHeaderProps = {
  counts: {
    total: number;
    admin: number;
    instructor: number;
    student: number;
  };
};

export function AdminUsersPageHeader({ counts }: AdminUsersPageHeaderProps) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
            <i className="ri-user-settings-line" />
            사용자 관리
          </div>
          <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
            역할별 사용자와
            <br />
            활동 상태를 빠르게 찾습니다.
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
            검색과 역할 필터를 함께 써서 필요한 계정만 빠르게 좁힐 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">전체</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{counts.total}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">수강생</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{counts.student}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">교강사</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{counts.instructor}</div>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-3">
            <div className="text-[11px] text-white/60">운영자</div>
            <div className="mt-1 text-[20px] font-extrabold text-white">{counts.admin}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
