import type { AILogOverview, AIInsights, AuthUser, CourseCard, Dashboard } from '@myway/shared';
import { AdminStatsComparisonPanel } from '../components/AdminStatsComparisonPanel';
import { AdminStatsDistributionPanel } from '../components/AdminStatsDistributionPanel';
import { AdminStatsLogPanel } from '../components/AdminStatsLogPanel';
import { AdminStatsOperationalPanel } from '../components/AdminStatsOperationalPanel';
import { AdminStatsOverviewCards } from '../components/AdminStatsOverviewCards';

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

function formatDelta(current: number, previous: number, suffix = ''): string {
  if (previous === 0) {
    if (current === 0) {
      return '변화 없음';
    }

    return `+${formatTokenCount(current)}${suffix}`;
  }

  const delta = ((current - previous) / previous) * 100;
  const prefix = delta >= 0 ? '+' : '';
  return `${prefix}${Math.round(delta)}%`;
}

function buildHalfWindows<T>(items: T[]): { current: T[]; previous: T[] } {
  const pivot = Math.max(1, Math.ceil(items.length / 2));
  return {
    current: items.slice(0, pivot),
    previous: items.slice(pivot),
  };
}

function getSuccessRate(logs: Array<{ success: number }>): number {
  if (logs.length === 0) {
    return 0;
  }

  return Math.round((logs.filter((log) => log.success === 1).length / logs.length) * 100);
}

function getAverageLatency(logs: Array<{ latency_ms: number }>): number {
  if (logs.length === 0) {
    return 0;
  }

  return Math.round(logs.reduce((sum, log) => sum + log.latency_ms, 0) / logs.length);
}

function getTokenTotal(logs: Array<{ input_tokens: number; output_tokens: number }>): number {
  return logs.reduce((sum, log) => sum + log.input_tokens + log.output_tokens, 0);
}

export function AdminStatsPage({ dashboard, courses, users, insights, aiLogs }: AdminStatsPageProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-6 shadow-sm lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
              <i className="ri-bar-chart-box-line" />
              운영 통계
            </div>
            <h2 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900">운영 통계 상세</h2>
            <p className="mt-1 text-[13px] text-slate-600">사용자/강의/AI 로그를 비교해 운영 병목과 이상치를 빠르게 확인합니다.</p>
          </div>
        </div>
      </section>
      <AdminStatsOverviewCards dashboard={dashboard} courses={courses} users={users} insights={insights} aiLogs={aiLogs} />
      <AdminStatsComparisonPanel aiLogs={aiLogs} />
      <AdminStatsOperationalPanel courses={courses} users={users} insights={insights} aiLogs={aiLogs} />
      <AdminStatsDistributionPanel aiLogs={aiLogs} />
      <AdminStatsLogPanel aiLogs={aiLogs} />
    </div>
  );
}
