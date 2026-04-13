import type { AIInsights, LectureDetail } from '@myway/shared';
import { AiNoticeBanner } from '../components/AiNoticeBanner';
import { getPublicTestPolicyText } from '../../../lib/ai-access';

type AISummaryPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
};

export function AISummaryPage({ highlightedLecture, insights }: AISummaryPageProps) {
  const lectureTitle = highlightedLecture?.title ?? '선택된 강의 없음';
  const lectureCourse = highlightedLecture?.course_title ?? '강의 요약 화면';
  const lectureExcerpt = highlightedLecture?.transcript_excerpt ?? '강의를 선택하면 핵심 개념과 전사 일부가 표시됩니다.';

  return (
    <div className="space-y-6">
      <AiNoticeBanner
        title="AI 요약 안내"
        description={getPublicTestPolicyText('summary')}
        tone="amber"
        meta="로그인 + quota 적용"
      />

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <i className="ri-file-text-line" />
              AI 요약
            </div>
            <h1 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
              강의 전사에서 핵심 개념만
              <br />
              먼저 읽고 빠르게 복습합니다.
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
              선택한 강의의 전사, 키워드, 복습 우선순위를 한 화면에 정리했습니다. 긴 텍스트를 읽기 전에 중요한 흐름부터 봅니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">최근 요청</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{insights?.summary.total_requests ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">성공률</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{insights?.summary.success_rate ?? 0}%</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">검토 창</div>
              <div className="mt-1 text-[20px] font-extrabold text-white">{insights?.summary.recent_window_days ?? 0}일</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <div className="text-[11px] text-white/60">대상 강의</div>
              <div className="mt-1 line-clamp-1 text-[14px] font-bold text-white">{lectureTitle}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">강의 요약</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                {lectureCourse} · {highlightedLecture ? highlightedLecture.course_instructor : '강의 선택 필요'}
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">요약 우선</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: '핵심 흐름', value: '개념 → 예제 → 복습' },
              { label: '복습 포인트', value: '자주 놓치는 개념 우선' },
              { label: '읽는 순서', value: '제목 → 요약 → 전사' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[11px] font-semibold text-slate-400">{item.label}</div>
                <div className="mt-1 text-[14px] font-bold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5">
            <div className="text-[12px] font-semibold text-indigo-600">선택된 강의</div>
            <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">{lectureTitle}</div>
            <p className="mt-3 text-[13px] leading-7 text-slate-600">{lectureExcerpt}</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { title: '요약 작성 방식', body: '전사에서 반복 개념과 정리 문장을 먼저 읽고, 핵심 문장을 앞에 둡니다.' },
              { title: '복습 우선순위', body: '오류 가능성이 높은 개념을 먼저 읽고, 예제는 그 다음에 확인합니다.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <div className="text-[13px] font-bold text-slate-900">{item.title}</div>
                <p className="mt-2 text-[12px] leading-6 text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-robot-line text-indigo-600" />
              AI 인사이트
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] text-slate-400">최근 AI 사용량</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.total_requests ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] text-slate-400">성공률</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.success_rate ?? 0}%</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] text-slate-400">추천 창</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{insights?.summary.recent_window_days ?? 0}일</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[11px] text-slate-400">강의 인지</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{highlightedLecture ? 'ON' : 'OFF'}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-slate-900">사용 팁</h3>
            <div className="mt-3 space-y-2 text-[12px] leading-6 text-slate-500">
              <p>1. 강의 상세에서 차시를 먼저 선택한 뒤 요약을 보면 맥락이 더 잘 보입니다.</p>
              <p>2. 요약을 먼저 읽고 바로 영상 시청으로 가면 복습 효율이 높습니다.</p>
              <p>3. AI 요약과 AI 챗을 함께 쓰면 긴 전사를 더 빠르게 정리할 수 있습니다.</p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
