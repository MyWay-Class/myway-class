import type { ShortformCommunityItem } from '@myway/shared';

type ShortformWizardSidebarProps = {
  courseTitle?: string | null;
  selectedClipsCount: number;
  selectedDurationLabel: string;
  highlightedLectureTitle?: string | null;
  communityItems: ShortformCommunityItem[];
};

export function ShortformWizardSidebar({
  courseTitle,
  selectedClipsCount,
  selectedDurationLabel,
  highlightedLectureTitle,
  communityItems,
}: ShortformWizardSidebarProps) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20">
      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">선택 요약</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">선택한 강좌</div>
            <div className="mt-1 text-[14px] font-semibold text-slate-900">{courseTitle ?? '없음'}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">선택한 클립</div>
            <div className="mt-1 text-[14px] font-semibold text-slate-900">
              {selectedClipsCount}개 · {selectedDurationLabel}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">선택한 강의</div>
            <div className="mt-1 text-[14px] font-semibold text-slate-900">{highlightedLectureTitle ?? '없음'}</div>
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">작업 흐름</h3>
        <div className="mt-4 space-y-2 text-[13px] leading-6 text-slate-500">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-800">1. 강좌 선택</span>
            <p className="mt-1">숏폼을 만들 강의를 먼저 고릅니다.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-800">2. 구간 선택</span>
            <p className="mt-1">추천 구간을 눌러 후보를 좁힙니다.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <span className="font-semibold text-slate-800">3. 미리보기 저장</span>
            <p className="mt-1">제목과 설명을 정리하고 저장합니다.</p>
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">커뮤니티 미리보기</h3>
        <p className="mt-1 text-[12px] text-slate-500">현재 강좌와 연결된 공유 숏폼을 바로 확인할 수 있습니다.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
          {communityItems.length > 0 ? (
            communityItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[12px] font-semibold text-indigo-600">{item.shared_by_name}</div>
                <div className="mt-1 text-[14px] font-bold text-slate-900">{item.title}</div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-6 text-slate-500">{item.description}</p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{item.course_title}</span>
                  <span>{item.total_segments}개 클립</span>
                </div>
              </article>
            ))
          ) : (
            <p className="text-[13px] leading-6 text-slate-500">공유된 숏폼이 아직 없습니다.</p>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">조립 기준</h3>
        <div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-500">
          <p>선택한 강좌 안에서 차시별 추천 구간을 따라 조립합니다.</p>
          <p>선택한 클립은 미리보기 카드와 재생 목록에 그대로 반영됩니다.</p>
          <p>같은 강의 문맥 안에서만 공유하도록 현재 커뮤니티 흐름을 유지합니다.</p>
        </div>
      </article>
    </aside>
  );
}
