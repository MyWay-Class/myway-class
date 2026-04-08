import { useEffect, useState } from 'react';
import type { AIRagResult, AIInsights, LectureDetail } from '@myway/shared';
import { loadAIRAGOverview } from '../../../lib/ai-rag';

type AIChatPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
};

export function AIChatPage({ highlightedLecture, insights }: AIChatPageProps) {
  const [ragOverview, setRagOverview] = useState<AIRagResult | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    if (!highlightedLecture) {
      setRagOverview(null);
      setRagLoading(false);
      return undefined;
    }

    setRagLoading(true);
    loadAIRAGOverview({
      query: `${highlightedLecture.title}의 핵심을 근거와 함께 정리해줘`,
      lecture_id: highlightedLecture.id,
      limit: 4,
    })
      .then((result) => {
        if (alive) {
          setRagOverview(result);
        }
      })
      .finally(() => {
        if (alive) {
          setRagLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [highlightedLecture?.id, highlightedLecture?.title]);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-[15px] font-bold text-slate-900">AI 학습 챗</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            {highlightedLecture ? `${highlightedLecture.title} 기준으로 질문을 이어갈 수 있습니다.` : '강의 기반 질문과 복습을 위한 채팅 화면입니다.'}
          </p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="flex gap-3">
            <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <i className="ri-robot-line" />
            </div>
            <div className="max-w-[75%] rounded-2xl bg-slate-100 px-4 py-3 text-[13px] leading-6 text-slate-700">
              핵심 개념만 빠르게 다시 보려면 어떤 순서로 복습하면 좋을까요?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl bg-indigo-600 px-4 py-3 text-[13px] leading-6 text-white">
              전사 요약, 퀴즈 생성, 숏폼 클립 순서로 보면 복습 효율이 높습니다.
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex gap-3">
            <input
              disabled
              value="강의 핵심 개념을 3줄로 요약해줘"
              readOnly
              className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[13px] text-slate-500"
            />
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white">
              <i className="ri-send-plane-fill" />
            </button>
          </div>
        </div>
      </section>

      <aside className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
        <h3 className="text-[15px] font-bold text-slate-900">추천 질문</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {['핵심 개념 요약', '시험 대비 문제', '이전 강의와 연결', '숏폼으로 복습'].map((chip) => (
            <span key={chip} className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500">
              {chip}
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
                {highlightedLecture ? highlightedLecture.title : '강의를 선택하면 파이프라인이 표시됩니다.'}
              </div>
            </div>
            {ragOverview ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                {ragOverview.provider.search_provider}
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
              <p className="mt-4 text-[12px] leading-5 text-slate-600">{ragOverview.answer.answer}</p>
              <div className="mt-4 space-y-2">
                {ragOverview.chunks.slice(0, 2).map((chunk) => (
                  <div key={chunk.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] font-semibold text-indigo-600">{chunk.title}</div>
                      <div className="text-[11px] text-slate-400">{Math.round(chunk.similarity * 100)}%</div>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-slate-600">{chunk.excerpt}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ragOverview.entities.slice(0, 4).map((entity) => (
                  <span
                    key={`${entity.kind}-${entity.value}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500"
                  >
                    {entity.label}: {entity.value}
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
      </aside>
    </div>
  );
}
