import type { AuthUser, CourseCard, LoginResponse } from '@myway/shared';
import { Button } from '../ui/Button';
import { AuthIdentityItem } from '../domain/AuthIdentityItem';
import { EnrollmentCardItem } from '../domain/EnrollmentCardItem';

type IdentityPanelProps = {
  loading: boolean;
  busy: boolean;
  notice: string;
  session: LoginResponse | null;
  apiStatus: 'checking' | 'online' | 'offline';
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
  apiStatus,
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
          <p>
            API 상태: <code>{apiStatus === 'checking' ? '확인 중' : apiStatus === 'online' ? '연결됨' : '오프라인'}</code>
          </p>
          {session ? (
            <Button variant="ghost" onClick={onLogout}>
              {busy ? '처리 중...' : '로그아웃'}
            </Button>
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
              <AuthIdentityItem
                key={user.id}
                user={user}
                isActive={session?.user.id === user.id}
                disabled={busy}
                onSelect={onLogin}
              />
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
                      <EnrollmentCardItem key={course.id} course={course} />
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
