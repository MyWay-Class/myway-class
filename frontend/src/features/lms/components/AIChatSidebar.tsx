import type { AIInsights, LectureDetail } from '@myway/shared';
import type { AIRagResult } from '@myway/shared';

type AIChatSidebarProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
  ragOverview: AIRagResult | null;
  ragLoading: boolean;
  openOnMobile: boolean;
  onCloseMobile: () => void;
};

function sanitizeDisplayText(value: string): string {
  const collapsed = value.replace(/\uFFFD/g, '').replace(/\?{3,}/g, '…').trim();
  return collapsed.length > 0 ? collapsed : '내용을 불러오지 못했습니다.';
}

export function AIChatSidebar({
  highlightedLecture,
  insights,
  ragOverview,
  ragLoading,
  openOnMobile,
  onCloseMobile,
}: AIChatSidebarProps) {
  return (
    <aside className={`${openOnMobile ? 'block' : 'hidden'} lg:block`}>
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">추천 질문</h3>
            <p className="mt-1 text-[12px] text-slate-500">{highlightedLecture ? highlightedLecture.title : '강의를 선택하면 더 정확한 질문이 표시됩니다.'}</p>
          </div>
          <button type="button" onClick={onCloseMobile} className="lg:hidden text-slate-400 hover:text-slate-600">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['핵심 개념 요약', '시험 대비 문제', '이전 강의와 연결', '숏폼으로 복습'].map((chip) => (
            <span key={chip} className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500">
              {sanitizeDisplayText(chip)}
            </span>
          ))}
        </div>

        {insights ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] font-semibold text-slate-500">최근 AI 사용량</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{insights.summary.total_requests}</div>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-500">RAG 파이프라인</div>
              <div className="mt-1 text-[14px] font-bold text-slate-900">
                {highlightedLecture ? sanitizeDisplayText(highlightedLecture.title) : '강의를 선택하면 파이프라인이 표시됩니다.'}
              </div>
            </div>
            {ragOverview ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                {sanitizeDisplayText(ragOverview.provider.search_provider)}
              </span>
            ) : null}
          </div>

          {ragLoading ? (
            <div className="mt-4 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
            </div>
          ) : ragOverview ? (
            <>
              <p className="mt-4 text-[12px] leading-5 text-slate-600">{sanitizeDisplayText(ragOverview.answer.answer)}</p>
              <div className="mt-4 space-y-2">
                {ragOverview.chunks.slice(0, 2).map((chunk) => (
                  <div key={chunk.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-indigo-600">{sanitizeDisplayText(chunk.title)}</div>
                      <div className="text-[11px] text-slate-400">{Math.round(chunk.similarity * 100)}%</div>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{sanitizeDisplayText(chunk.excerpt)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ragOverview.entities.slice(0, 4).map((entity) => (
                  <span
                    key={`${entity.kind}-${entity.value}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500"
                  >
                    {sanitizeDisplayText(entity.label)}: {sanitizeDisplayText(entity.value)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-[12px] leading-5 text-slate-500">
              선택한 강의에 대해 청킹, 인텐트, 엔티티, 검색 근거를 함께 보여줄 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
