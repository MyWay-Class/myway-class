import type { AuthUser, CourseCard, LoginResponse } from '@myway/shared';

type IdentityPanelProps = {
  loading: boolean;
  busy: boolean;
  notice: string;
  session: LoginResponse | null;
  demoUsers: AuthUser[];
  enrolledCourses: CourseCard[];
  getCurrentRoleLabel: () => string;
  onLogin: (userId: string) => void;
  onLogout: () => void;
};

export function IdentityPanel({
  loading,
  busy,
  notice,
  session,
  demoUsers,
  enrolledCourses,
  getCurrentRoleLabel,
  onLogin,
  onLogout,
}: IdentityPanelProps) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">MyWayClass · 인증과 권한</p>
          <h1>학습자, 강사, 운영자를 구분하는 기본 권한 체계</h1>
          <p className="lead">
            같은 LMS라도 역할이 섞이면 책임이 흐려집니다. 이 화면은 로그인, 로그아웃, 내 정보, 역할 기반 접근 제어를 먼저
            보여주고, 그 위에 기본 LMS 코어를 얹습니다.
          </p>
        </div>

        <aside className="hero-panel">
          <span className="hero-panel__label">{loading ? '로딩 중' : session ? '로그인 완료' : '게스트 모드'}</span>
          <strong>{notice}</strong>
          <p>
            현재 상태: <code>{session ? `${session.user.name} · ${getCurrentRoleLabel()}` : '로그인 대기'}</code>
          </p>
          <p>
            권한: <code>{session ? session.permissions.join(', ') : 'NONE'}</code>
          </p>
          {session ? (
            <button className="action-button action-button--ghost" onClick={onLogout} type="button">
              {busy ? '처리 중...' : '로그아웃'}
            </button>
          ) : null}
        </aside>
      </section>

      <section className="auth-grid">
        <div className="panel panel--wide">
          <div className="panel__header">
            <div>
              <p className="section-label">로그인</p>
              <h2>데모 계정으로 역할을 전환해보세요</h2>
            </div>
          </div>

          <div className="auth-card-grid">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                className={`auth-card ${session?.user.id === user.id ? 'is-active' : ''}`}
                disabled={busy}
                onClick={() => onLogin(user.id)}
                type="button"
              >
                <span className="auth-card__role">{user.role}</span>
                <strong>{user.name}</strong>
                <p>{user.bio}</p>
                <dl>
                  <div>
                    <dt>부서</dt>
                    <dd>{user.department}</dd>
                  </div>
                  <div>
                    <dt>이메일</dt>
                    <dd>{user.email}</dd>
                  </div>
                </dl>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="section-label">내 정보</p>
              <h2>{session?.user.name ?? '로그인 전'}</h2>
            </div>
          </div>

          {session ? (
            <>
              <div className="detail-grid detail-grid--single">
                <article>
                  <span>역할</span>
                  <strong>{session.user.role}</strong>
                </article>
                <article>
                  <span>권한 라벨</span>
                  <strong>{getCurrentRoleLabel()}</strong>
                </article>
                <article>
                  <span>이메일</span>
                  <strong>{session.user.email}</strong>
                </article>
                <article>
                  <span>부서</span>
                  <strong>{session.user.department}</strong>
                </article>
              </div>

              <div className="enrollment-panel">
                <div className="enrollment-panel__header">
                  <div>
                    <p className="section-label">내 수강</p>
                    <h3>{enrolledCourses.length ? `${enrolledCourses.length}개 강의 수강 중` : '수강 중인 강의 없음'}</h3>
                  </div>
                </div>

                {enrolledCourses.length > 0 ? (
                  <div className="enrollment-list">
                    {enrolledCourses.map((course) => (
                      <article key={course.id} className="enrollment-card">
                        <div className="enrollment-card__head">
                          <strong>{course.title}</strong>
                          <span>{course.progress_percent}%</span>
                        </div>
                        <p>
                          완료 {course.completed_lectures} / {course.lecture_count} · {course.category}
                        </p>
                        <div className="progress-track" aria-hidden="true">
                          <span style={{ width: `${course.progress_percent}%` }} />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">수강 신청을 하면 여기에서 진도와 완료한 강의가 보입니다.</p>
                )}
              </div>
            </>
          ) : (
            <p className="empty-state">로그인하면 내 정보와 진도, 수강 상태가 보입니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
