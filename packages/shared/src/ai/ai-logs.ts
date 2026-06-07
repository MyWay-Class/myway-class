import { demoAIIntentLogs, demoAIQuestionLogs, demoAIUsageLogs, getDemoUser } from '../data/demo-data';
import type { AILogOverview, AILogSummary, AIIntentLog, AIQuestionLog, AIUsageGroupStat, AIUsageLog, UserRole } from '../types';

const RECENT_WINDOW_DAYS = 7;

function formatLabel(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getSuccessRate(successCount: number, totalCount: number): number {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((successCount / totalCount) * 100);
}

function sortByCreatedAtDesc<T extends { created_at: string }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function buildUsageStats(logs: AIUsageLog[], getKey: (log: AIUsageLog) => string): AIUsageGroupStat[] {
  const grouped = new Map<
    string,
    {
      count: number;
      successCount: number;
      latencyTotal: number;
      inputTokenTotal: number;
      outputTokenTotal: number;
    }
  >();

  for (const log of logs) {
    const key = getKey(log);
    const current = grouped.get(key) ?? {
      count: 0,
      successCount: 0,
      latencyTotal: 0,
      inputTokenTotal: 0,
      outputTokenTotal: 0,
    };

    current.count += 1;
    current.successCount += log.success;
    current.latencyTotal += log.latency_ms;
    current.inputTokenTotal += log.input_tokens;
    current.outputTokenTotal += log.output_tokens;
    grouped.set(key, current);
  }

  const stats = [...grouped.entries()].map(([key, data]) => ({
    key,
    label: formatLabel(key),
    count: data.count,
    success_rate: getSuccessRate(data.successCount, data.count),
    avg_latency_ms: Math.round(data.latencyTotal / data.count),
    input_tokens: data.inputTokenTotal,
    output_tokens: data.outputTokenTotal,
  }));

  stats.sort((a, b) => b.count - a.count);
  return stats;
}

function buildSummary(usageLogs: AIUsageLog[]): AILogSummary {
  const totalRequests = usageLogs.length;
  const successCount = usageLogs.filter((log) => log.success === 1).length;
  const latencyTotal = usageLogs.reduce((sum, log) => sum + log.latency_ms, 0);
  const totalInputTokens = usageLogs.reduce((sum, log) => sum + log.input_tokens, 0);
  const totalOutputTokens = usageLogs.reduce((sum, log) => sum + log.output_tokens, 0);
  const uniqueUsers = new Set(usageLogs.map((log) => log.user_id).filter(Boolean)).size;
  const providerStats = buildUsageStats(usageLogs, (log) => log.provider);
  const modelStats = buildUsageStats(usageLogs, (log) => log.model);

  return {
    total_requests: totalRequests,
    success_rate: getSuccessRate(successCount, totalRequests),
    avg_latency_ms: totalRequests === 0 ? 0 : Math.round(latencyTotal / totalRequests),
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    unique_users: uniqueUsers,
    recent_window_days: RECENT_WINDOW_DAYS,
    top_provider: providerStats[0]?.label ?? '없음',
    top_model: modelStats[0]?.label ?? '없음',
  };
}

export function buildAILogOverview(
  usageLogs: AIUsageLog[],
  intentLogs: AIIntentLog[],
  questionLogs: AIQuestionLog[],
): AILogOverview {
  return {
    summary: buildSummary(usageLogs),
    provider_stats: buildUsageStats(usageLogs, (log) => log.provider),
    model_stats: buildUsageStats(usageLogs, (log) => log.model),
    usage_logs: sortByCreatedAtDesc(usageLogs),
    intent_logs: sortByCreatedAtDesc(intentLogs),
    question_logs: sortByCreatedAtDesc(questionLogs),
  };
}

export function getAILogOverviewForUser(userId: string): AILogOverview {
  const user = getDemoUser(userId);
  const role: UserRole = user?.role ?? 'STUDENT';
  const usageLogs = demoAIUsageLogs.filter((log) => log.user_id === userId || role === 'ADMIN');
  const intentLogs = demoAIIntentLogs.filter((log) => log.user_id === userId || role === 'ADMIN');
  const questionLogs = demoAIQuestionLogs.filter((log) => log.user_id === userId || role === 'ADMIN');

  return buildAILogOverview(usageLogs, intentLogs, questionLogs);
}
