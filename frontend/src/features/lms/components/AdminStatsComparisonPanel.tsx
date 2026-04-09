import type { AILogOverview } from '@myway/shared';
import { ComparisonCardGrid } from './ComparisonCardGrid';
import { buildHalfWindows, formatDelta, formatTokenCount, getAverageLatency, getSuccessRate, getTokenTotal } from './admin-stats-utils';

type AdminStatsComparisonPanelProps = {
  aiLogs: AILogOverview | null;
};

export function AdminStatsComparisonPanel({ aiLogs }: AdminStatsComparisonPanelProps) {
  const allUsageLogs = aiLogs?.usage_logs ?? [];
  const comparisonWindows = buildHalfWindows(allUsageLogs);

  const comparisonMetrics = [
    {
      title: 'AI 요청 수',
      current_label: '최근 집계',
      current_value: formatTokenCount(comparisonWindows.current.length),
      previous_label: '이전 집계',
      previous_value: formatTokenCount(comparisonWindows.previous.length),
      delta_label: formatDelta(comparisonWindows.current.length, comparisonWindows.previous.length),
      note: '최근 AI 호출량을 이전 집계와 비교합니다.',
      tone: 'indigo' as const,
    },
    {
      title: '성공률',
      current_label: '최근 집계',
      current_value: `${getSuccessRate(comparisonWindows.current)}%`,
      previous_label: '이전 집계',
      previous_value: `${getSuccessRate(comparisonWindows.previous)}%`,
      delta_label: formatDelta(getSuccessRate(comparisonWindows.current), getSuccessRate(comparisonWindows.previous)),
      note: '성공률이 오르는지 빠르게 파악합니다.',
      tone: 'emerald' as const,
    },
    {
      title: '평균 지연시간',
      current_label: '최근 집계',
      current_value: `${getAverageLatency(comparisonWindows.current)}ms`,
      previous_label: '이전 집계',
      previous_value: `${getAverageLatency(comparisonWindows.previous)}ms`,
      delta_label: formatDelta(getAverageLatency(comparisonWindows.current), getAverageLatency(comparisonWindows.previous)),
      note: '응답 속도 변화를 함께 확인합니다.',
      tone: 'amber' as const,
    },
    {
      title: '입출력 토큰',
      current_label: '최근 집계',
      current_value: formatTokenCount(getTokenTotal(comparisonWindows.current)),
      previous_label: '이전 집계',
      previous_value: formatTokenCount(getTokenTotal(comparisonWindows.previous)),
      delta_label: formatDelta(getTokenTotal(comparisonWindows.current), getTokenTotal(comparisonWindows.previous)),
      note: '추론 비용 추이를 함께 봅니다.',
      tone: 'violet' as const,
    },
  ];

  return (
    <ComparisonCardGrid
      title="운영 비교"
      subtitle="최근 집계와 이전 집계를 나란히 비교해 AI 사용 흐름을 빠르게 파악합니다."
      metrics={comparisonMetrics}
    />
  );
}
