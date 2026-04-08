import type { AIInsights, LectureDetail } from '@myway/shared';

type AIChatPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
};

export function AIChatPage({ highlightedLecture, insights }: AIChatPageProps) {
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
      </aside>
    </div>
  );
}
