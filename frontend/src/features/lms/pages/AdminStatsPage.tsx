import type { AILogOverview, AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';

type AdminStatsPageProps = {
  dashboard: Dashboard | null;
  courses: CourseCard[];
  users: AuthUser[];
  insights: AIInsights | null;
  aiLogs: AILogOverview | null;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTokenCount(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function AdminStatsPage({ dashboard, courses, users, insights, aiLogs }: AdminStatsPageProps) {
  const averageProgress =
    dashboard?.average_progress ?? Math.round(courses.reduce((sum, course) => sum + course.progress_percent, 0) / Math.max(courses.length, 1));
  const aiSummary = aiLogs?.summary;
  const providerStats = aiLogs?.provider_stats ?? [];
  const modelStats = aiLogs?.model_stats ?? [];
  const usageLogs = aiLogs?.usage_logs.slice(0, 6) ?? [];
  const intentLogs = aiLogs?.intent_logs.slice(0, 4) ?? [];
  const questionLogs = aiLogs?.question_logs.slice(0, 4) ?? [];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{users.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">전체 사용자</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{courses.length}</div>
          <div className="mt-1 text-[12px] text-slate-500">전체 강의</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{averageProgress}%</div>
          <div className="mt-1 text-[12px] text-slate-500">평균 진도</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary?.total_requests ?? insights?.summary.total_requests ?? 0}</div>
          <div className="mt-1 text-[12px] text-slate-500">AI 요청 수</div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">운영 현황</h2>
          <p className="mt-3 text-[13px] leading-7 text-slate-500">
            전체 {users.length}명 사용자 중 수강생, 교강사, 운영자가 함께 사용 중이며, 현재 등록된 강의는 {courses.length}개입니다.
            평균 학습 진도는 {averageProgress}%이고, AI 추적 요약은 아래에서 바로 확인할 수 있습니다.
          </p>

          {aiSummary ? (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">성공률</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary.success_rate}%</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">평균 지연시간</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{aiSummary.avg_latency_ms}ms</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">입력 토큰</div>
                <div className="mt-1 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">{formatTokenCount(aiSummary.total_input_tokens)}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="text-[12px] text-slate-500">대표 provider</div>
                <div className="mt-1 text-[18px] font-bold tracking-[-0.03em] text-slate-900">{aiSummary.top_provider}</div>
                <div className="mt-1 text-[11px] text-slate-500">대표 model: {aiSummary.top_model}</div>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">최근 AI 호출</h2>
          <div className="mt-4 space-y-3">
            {usageLogs.length > 0 ? (
              usageLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">{log.feature}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {log.provider} · {log.model} · {formatDateTime(log.created_at)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        log.success === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">Provider 분포</h2>
          <div className="mt-4 space-y-3">
            {providerStats.map((stat) => (
              <div key={stat.key} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">{stat.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {stat.count}건 · 성공률 {stat.success_rate}% · 평균 {stat.avg_latency_ms}ms
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>입력 {formatTokenCount(stat.input_tokens)}</div>
                    <div>출력 {formatTokenCount(stat.output_tokens)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">Model 분포</h2>
          <div className="mt-4 space-y-3">
            {modelStats.map((stat) => (
              <div key={stat.key} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-900">{stat.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {stat.count}건 · 성공률 {stat.success_rate}% · 평균 {stat.avg_latency_ms}ms
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>입력 {formatTokenCount(stat.input_tokens)}</div>
                    <div>출력 {formatTokenCount(stat.output_tokens)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">인텐트 로그</h2>
          <div className="mt-4 space-y-3">
            {intentLogs.length > 0 ? (
              intentLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">{log.detected_intent}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {log.feature} · 신뢰도 {Math.round(log.confidence * 100)}% · {formatDateTime(log.created_at)}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.success ? '성공' : '실패'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-slate-600">{log.message}</p>
                </div>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">인텐트 로그가 없습니다.</p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-[15px] font-bold text-slate-900">질문/답변 로그</h2>
          <div className="mt-4 space-y-3">
            {questionLogs.length > 0 ? (
              questionLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">{log.question}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {log.model} · {formatDateTime(log.created_at)}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.success ? '성공' : '실패'}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-slate-600">{log.answer}</p>
                </div>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">질문/답변 로그가 없습니다.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
