import type { AILogOverview } from '@myway/shared';
import { formatTokenCount } from './admin-stats-utils';

type AdminStatsDistributionPanelProps = {
  aiLogs: AILogOverview | null;
};

export function AdminStatsDistributionPanel({ aiLogs }: AdminStatsDistributionPanelProps) {
  const providerStats = aiLogs?.provider_stats ?? [];
  const modelStats = aiLogs?.model_stats ?? [];

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900">Provider 분포</h2>
        <div className="mt-4 space-y-3">
          {providerStats.map((stat) => (
            <div key={stat.key} className="rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
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

      <article className="rounded-3xl border border-cyan-100 bg-white px-5 py-5 shadow-sm">
        <h2 className="text-[15px] font-bold text-slate-900">Model 분포</h2>
        <div className="mt-4 space-y-3">
          {modelStats.map((stat) => (
            <div key={stat.key} className="rounded-2xl border border-cyan-100 bg-cyan-50/50 px-4 py-3">
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
  );
}
