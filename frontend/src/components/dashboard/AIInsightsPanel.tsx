import type { AIInsights } from '@myway/shared';
import { formatPercentage } from '../../lib/format';

type AIInsightsPanelProps = {
  insights: AIInsights | null;
};

function renderRoleInsight(insights: AIInsights) {
  if (insights.role_insight.role === 'STUDENT') {
    return (
      <div className="enrollment-list">
        <article className="enrollment-card">
          <div className="enrollment-card__head">
            <strong>추천 행동</strong>
            <span>{insights.role_insight.recommended_actions.length}개</span>
          </div>
          <ul className="plain-list">
            {insights.role_insight.recommended_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </div>
    );
  }

  if (insights.role_insight.role === 'INSTRUCTOR') {
    return (
      <div className="enrollment-list">
        <article className="enrollment-card">
          <div className="enrollment-card__head">
            <strong>강의별 질문 패턴</strong>
            <span>{insights.role_insight.total_questions}건</span>
          </div>
          {insights.role_insight.top_lecture_questions.length > 0 ? (
            insights.role_insight.top_lecture_questions.map((item) => (
              <div key={item.lecture_id} className="insight-row">
                <div>
                  <strong>{item.lecture_title}</strong>
                  <p>질문 {item.question_count}건</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">아직 질문 데이터가 충분하지 않습니다.</p>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="enrollment-list">
      <article className="enrollment-card">
        <div className="enrollment-card__head">
          <strong>운영 개요</strong>
          <span>{insights.role_insight.ai_usage_7d}건</span>
        </div>
        <dl className="detail-grid detail-grid--single">
          <div>
            <dt>사용자</dt>
            <dd>{insights.role_insight.total_users}명</dd>
          </div>
          <div>
            <dt>공개 강의</dt>
            <dd>{insights.role_insight.published_courses}개</dd>
          </div>
          <div>
            <dt>수강 관계</dt>
            <dd>{insights.role_insight.total_enrollments}건</dd>
          </div>
          <div>
            <dt>7일 AI 사용</dt>
            <dd>{insights.role_insight.ai_usage_7d}건</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  return (
    <section className="panel panel--wide">
      <div className="panel__header">
        <div>
          <p className="section-label">AI 인사이트</p>
          <h2>AI 사용량과 인텐트, 역할별 통계를 확인합니다</h2>
        </div>
      </div>

      {insights ? (
        <>
          <div className="metrics">
            <article>
              <span>총 요청</span>
              <strong>{insights.summary.total_requests}</strong>
            </article>
            <article>
              <span>성공률</span>
              <strong>{formatPercentage(insights.summary.success_rate)}</strong>
            </article>
            <article>
              <span>평균 지연</span>
              <strong>{insights.summary.avg_latency_ms}ms</strong>
            </article>
            <article>
              <span>고유 사용자</span>
              <strong>{insights.summary.unique_users}명</strong>
            </article>
          </div>

          <div className="detail-grid">
            <article>
              <span>주요 기능</span>
              <strong>{insights.feature_stats[0]?.label ?? '없음'}</strong>
            </article>
            <article>
              <span>기능 성공률</span>
              <strong>{formatPercentage(insights.feature_stats[0]?.success_rate ?? 0)}</strong>
            </article>
            <article>
              <span>주요 인텐트</span>
              <strong>{insights.intent_stats[0]?.label ?? '없음'}</strong>
            </article>
            <article>
              <span>인텐트 성공률</span>
              <strong>{formatPercentage(insights.intent_stats[0]?.success_rate ?? 0)}</strong>
            </article>
          </div>

          {renderRoleInsight(insights)}
        </>
      ) : (
        <p className="empty-state">로그인하면 AI 사용량과 인사이트가 보입니다.</p>
      )}
    </section>
  );
}
