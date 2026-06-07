export function MyShortformsHero({
  selectedTitle,
  ownedVideosCount,
  savedVideosCount,
  customCoursesCount,
}: {
  selectedTitle: string;
  ownedVideosCount: number;
  savedVideosCount: number;
  customCoursesCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-5 py-5 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-extrabold tracking-[-0.03em]">내 숏폼 라이브러리</h2>
          <p className="mt-2 text-[12px] leading-6 text-cyan-50/85">내 숏폼, 저장 숏폼, 개인 코스를 검색/관리하고 바로 공유할 수 있습니다.</p>
          <div className="mt-2 text-[11px] text-cyan-100/80">{selectedTitle}</div>
        </div>
        <div className="rounded-xl border border-cyan-100/25 bg-white/10 px-4 py-3 text-[12px] text-cyan-50/90">
          <div>내 숏폼 {ownedVideosCount}개 · 저장 {savedVideosCount}개</div>
          <div className="mt-1">개인 코스 {customCoursesCount}개</div>
        </div>
      </div>
    </section>
  );
}
