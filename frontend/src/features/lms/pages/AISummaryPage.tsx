import type { AIInsights, LectureDetail } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { getPublicTestPolicyText } from '../../../lib/ai-access';

type AISummaryPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
};

export function AISummaryPage({ highlightedLecture, insights }: AISummaryPageProps) {
  return (
    <div className="space-y-5">
      <AiNoticeBanner
        title="공개 테스트 안내"
        description={getPublicTestPolicyText('summary')}
        tone="amber"
        meta="로그인 + quota 적용"
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">AI 강의 요약</h2>
          <p className="mt-1 text-[12px] text-slate-500">
            {highlightedLecture ? `${highlightedLecture.title}의 전사와 핵심 개념을 요약하는 화면입니다.` : '강의 요약 화면입니다.'}
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[13px] font-semibold text-slate-900">핵심 요약</div>
            <p className="mt-2 text-[13px] leading-7 text-slate-600">
              강의의 개념 흐름, 예제 포인트, 복습 우선순위를 한 번에 파악할 수 있도록 요약 영역을 배치했습니다.
            </p>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">AI 인사이트</h3>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="text-[12px] text-slate-500">최근 AI 사용량</div>
            <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.total_requests ?? 0}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
