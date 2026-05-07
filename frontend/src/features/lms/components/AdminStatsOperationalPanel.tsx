import type { AILogOverview, AIInsights, AuthUser, CourseCard } from '@myway/shared';
import { formatTokenCount } from './admin-stats-utils';

type AdminStatsOperationalPanelProps = {
  courses: CourseCard[];
  users: AuthUser[];
  insights: AIInsights | null;
  aiLogs: AILogOverview | null;
};

export function AdminStatsOperationalPanel({ courses, users, insights, aiLogs }: AdminStatsOperationalPanelProps) {
  const averageProgress = Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const aiSummary = aiLogs?.summary;
  const usageLogs = aiLogs?.usage_logs?.slice(0, 6) ?? [];

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900">운영 현황</h2>
        <p className="mt-3 text-[13px] leading-7 text-slate-500">
          전체 {users.length}명 사용자 중 수강생, 교강사, 운영자가 함께 사용 중이며, 현재 등록된 강의는 {courses.length}개입니다.
          평균 학습 진도는 {averageProgress}%이고, AI 추적 요약은 아래에서 바로 확인할 수 있습니다.
        </p>

        {aiSummary ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-4">
              <div className="text-[12px] text-slate-500">성공률</div>
              <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary.success_rate}%</div>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-4">
              <div className="text-[12px] text-slate-500">평균 지연시간</div>
              <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary.avg_latency_ms}ms</div>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-4">
              <div className="text-[12px] text-slate-500">입력 토큰</div>
              <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{formatTokenCount(aiSummary.total_input_tokens)}</div>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-4 py-4">
              <div className="text-[12px] text-slate-500">대표 provider</div>
              <div className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-slate-900">{aiSummary.top_provider}</div>
              <div className="mt-1 text-[11px] text-slate-500">대표 model: {aiSummary.top_model}</div>
            </div>
          </div>
        ) : null}
      </article>

      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900">최근 AI 호출</h2>
        <div className="mt-4 space-y-3">
          {usageLogs.length > 0 ? (
            usageLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">{log.feature}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {log.provider} · {log.model}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${log.success === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {log.success === 1 ? '성공' : '실패'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>입력 {formatTokenCount(log.input_tokens)}</div>
                  <div>출력 {formatTokenCount(log.output_tokens)}</div>
                  <div>지연 {log.latency_ms}ms</div>
                  <div>{log.error_message ?? '오류 없음'}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[13px] leading-6 text-slate-500">아직 AI 호출 로그가 없습니다.</p>
          )}
        </div>
      </article>
    </section>
  );
}
