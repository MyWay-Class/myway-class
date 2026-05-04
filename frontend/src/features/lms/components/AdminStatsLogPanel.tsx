import type { AILogOverview } from '@myway/shared';
import { formatDateTime } from './admin-stats-utils';

type AdminStatsLogPanelProps = {
  aiLogs: AILogOverview | null;
};

export function AdminStatsLogPanel({ aiLogs }: AdminStatsLogPanelProps) {
  const intentLogs = aiLogs?.intent_logs?.slice(0, 4) ?? [];
  const questionLogs = aiLogs?.question_logs?.slice(0, 4) ?? [];

  return (
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
  );
}
