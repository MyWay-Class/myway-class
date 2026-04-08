import { useEffect, useMemo, useState } from 'react';
import type { AIRecommendationOverview, AIUserSettings } from '@myway/shared';
import { formatDifficulty, formatPercentage } from '../../lib/format';
import { Button } from '../ui/Button';

type AIRecommendationsPanelProps = {
  busy: boolean;
  recommendations: AIRecommendationOverview | null;
  settings: AIUserSettings | null;
  onSaveAISettings: (input: {
    language?: 'ko' | 'en';
    theme?: 'light' | 'dark' | 'system';
    auto_summary?: boolean;
    recommendation_mode?: 'progress' | 'discovery' | 'balanced';
  }) => Promise<boolean>;
};

type SettingsDraft = {
  language: 'ko' | 'en';
  theme: 'light' | 'dark' | 'system';
  auto_summary: boolean;
  recommendation_mode: 'progress' | 'discovery' | 'balanced';
};

function getModeLabel(value: SettingsDraft['recommendation_mode']): string {
  switch (value) {
    case 'progress':
      return '진도 우선';
    case 'discovery':
      return '새 과목 우선';
    case 'balanced':
      return '균형';
    default:
      return value;
  }
}

function getThemeLabel(value: SettingsDraft['theme']): string {
  switch (value) {
    case 'light':
      return '라이트';
    case 'dark':
      return '다크';
    case 'system':
      return '시스템';
    default:
      return value;
  }
}

function getLanguageLabel(value: SettingsDraft['language']): string {
  return value === 'ko' ? '한국어' : 'English';
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AIRecommendationsPanel({
  busy,
  recommendations,
  settings,
  onSaveAISettings,
}: AIRecommendationsPanelProps) {
  const [draft, setDraft] = useState<SettingsDraft | null>(null);

  useEffect(() => {
    if (!settings) {
      setDraft(null);
      return;
    }

    setDraft({
      language: settings.language,
      theme: settings.theme,
      auto_summary: settings.auto_summary,
      recommendation_mode: settings.recommendation_mode,
    });
  }, [settings]);

  const summaryCards = useMemo(
    () =>
      recommendations
        ? [
            { label: '추천 수', value: `${recommendations.recommendations.length}개` },
            { label: '언어', value: getLanguageLabel(recommendations.settings.language) },
            { label: '테마', value: getThemeLabel(recommendations.settings.theme) },
            { label: '자동 요약', value: recommendations.settings.auto_summary ? '켜짐' : '꺼짐' },
          ]
        : [],
    [recommendations],
  );

  if (!recommendations || !settings || !draft) {
    return (
      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-label">AI 추천과 설정</p>
            <h2>로그인하면 개인화된 추천과 기본 설정이 보입니다</h2>
          </div>
        </div>
        <p className="empty-state">진행률이 낮은 수강 과목과 개인 선호를 함께 관리하는 영역입니다.</p>
      </section>
    );
  }

  return (
    <section className="panel panel--wide ai-recommendations-panel">
      <div className="panel__header">
        <div>
          <p className="section-label">AI 추천과 설정</p>
          <h2>수강 흐름과 개인 선호를 함께 정리합니다</h2>
        </div>
        <span className="hero-panel__label">최근 갱신 {formatDateTime(recommendations.updated_at)}</span>
      </div>

      <div className="metrics">
        {summaryCards.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="recommendations-layout">
        <div className="recommendation-list">
          {recommendations.recommendations.map((item) => (
            <article key={item.id} className="recommendation-card">
              <div className="recommendation-card__head">
                <div>
                  <p className="recommendation-card__eyebrow">
                    {item.source === 'progress'
                      ? '복습 우선'
                      : item.source === 'discovery'
                        ? '새 과목 추천'
                        : item.source === 'review'
                          ? '강사 점검'
                          : '운영 점검'}
                  </p>
                  <strong>{item.title}</strong>
                  <span>
                    {item.category} · {formatDifficulty(item.difficulty)} · {item.instructor_name}
                  </span>
                </div>
                <span className="recommendation-card__score">{formatPercentage(item.progress_percent)}</span>
              </div>

              <p className="recommendation-card__description">{item.description}</p>
              <p className="recommendation-card__reason">{item.reason}</p>

              <div className="lecture-detail__meta">
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <form
          className="recommendation-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSaveAISettings(draft);
          }}
        >
          <strong>개인 설정</strong>

          <label>
            언어
            <select value={draft.language} onChange={(event) => setDraft((current) => current && { ...current, language: event.target.value as SettingsDraft['language'] })}>
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </label>

          <label>
            테마
            <select value={draft.theme} onChange={(event) => setDraft((current) => current && { ...current, theme: event.target.value as SettingsDraft['theme'] })}>
              <option value="system">시스템</option>
              <option value="light">라이트</option>
              <option value="dark">다크</option>
            </select>
          </label>

          <label>
            추천 기준
            <select
              value={draft.recommendation_mode}
              onChange={(event) =>
                setDraft((current) =>
                  current && {
                    ...current,
                    recommendation_mode: event.target.value as SettingsDraft['recommendation_mode'],
                  },
                )
              }
            >
              <option value="progress">진도 우선</option>
              <option value="discovery">새 과목 우선</option>
              <option value="balanced">균형</option>
            </select>
          </label>

          <label className="resource-form__checkbox">
            <input
              checked={draft.auto_summary}
              onChange={(event) => setDraft((current) => current && { ...current, auto_summary: event.target.checked })}
              type="checkbox"
            />
            AI 자동 요약 사용
          </label>

          <p className="empty-state">
            현재 설정: {getLanguageLabel(draft.language)} · {getThemeLabel(draft.theme)} · {getModeLabel(draft.recommendation_mode)}
          </p>

          <Button disabled={busy} type="submit">
            {busy ? '저장 중...' : '설정 저장'}
          </Button>
        </form>
      </div>

      <div className="enrollment-list">
        <article className="enrollment-card">
          <div className="enrollment-card__head">
            <strong>추천 근거</strong>
            <span>{recommendations.suggested_actions.length}개</span>
          </div>
          <ul className="plain-list">
            {recommendations.suggested_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
