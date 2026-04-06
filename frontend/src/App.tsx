import { useEffect, useMemo, useState } from 'react';
import {
  canEnroll,
  demoUsers,
  type CourseCard,
  type CourseDetail,
  type Dashboard,
  type LectureDetail,
  type LoginResponse,
} from '@myway/shared';
import {
  clearStoredAuth,
  enrollCourse,
  getCurrentRoleLabel,
  loadCourseDetail,
  loadCourses,
  loadCurrentSession,
  loadDashboard,
  loadLectureDetail,
  loginWithUser,
  logoutCurrentSession,
  storeAuth,
} from './lib/api';

function formatDifficulty(value: CourseCard['difficulty']): string {
  switch (value) {
    case 'beginner':
      return '입문';
    case 'intermediate':
      return '중급';
    case 'advanced':
      return '고급';
    default:
      return value;
  }
}

function formatPercentage(value: number): string {
  return `${value}%`;
}

export default function App() {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [selectedLecture, setSelectedLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('로그인 후 내 정보와 진도가 활성화됩니다.');

  const selectedCourseCard = useMemo(
    () => courseCards.find((course) => course.id === selectedCourseId) ?? null,
    [courseCards, selectedCourseId],
  );

  const canEnrollCurrent = session ? canEnroll(session.user.role) : false;

  async function refreshLearningState(activeSession: LoginResponse | null) {
    const courses = await loadCourses(activeSession?.session_token);
    setCourseCards(courses);

    if (courses.length > 0) {
      setSelectedCourseId((current) => current || courses[0].id);
    }

    if (activeSession) {
      const dashboardData = await loadDashboard(activeSession.session_token);
      setDashboard(dashboardData);
      setNotice(`${activeSession.user.name} 님, ${activeSession.user.role} 계정으로 로그인했습니다.`);
    } else {
      setDashboard(null);
      setNotice('로그인 후 내 정보와 진도가 활성화됩니다.');
    }
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);

      const storedSession = await loadCurrentSession();

      if (!active) {
        return;
      }

      setSession(storedSession);
      await refreshLearningState(storedSession);
      setLoading(false);
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      return;
    }

    let active = true;

    async function loadSelectedCourse() {
      const course = await loadCourseDetail(selectedCourseId, session?.session_token);

      if (!active) {
        return;
      }

      setSelectedCourse(course);
      setSelectedLectureId(course?.lectures[0]?.id ?? '');
    }

    void loadSelectedCourse();

    return () => {
      active = false;
    };
  }, [selectedCourseId, session?.session_token]);

  useEffect(() => {
    if (!selectedLectureId) {
      setSelectedLecture(null);
      return;
    }

    let active = true;

    async function loadSelectedLecture() {
      const lecture = await loadLectureDetail(selectedLectureId, session?.session_token);

      if (!active) {
        return;
      }

      setSelectedLecture(lecture);
    }

    void loadSelectedLecture();

    return () => {
      active = false;
    };
  }, [selectedLectureId, session?.session_token]);

  async function handleLogin(userId: string) {
    setBusy(true);

    const auth = await loginWithUser(userId);
    if (!auth) {
      setNotice('로그인에 실패했습니다.');
      setBusy(false);
      return;
    }

    storeAuth(auth);
    setSession(auth);
    await refreshLearningState(auth);
    setBusy(false);
  }

  async function handleLogout() {
    setBusy(true);
    await logoutCurrentSession(session?.session_token);
    clearStoredAuth();
    setSession(null);
    setDashboard(null);
    await refreshLearningState(null);
    setBusy(false);
  }

  async function handleEnroll(courseId: string) {
    if (!session) {
      setNotice('수강 신청은 로그인 후 사용할 수 있습니다.');
      return;
    }

    if (!canEnrollCurrent) {
      setNotice('현재 계정은 수강 신청 권한이 없습니다.');
      return;
    }

    setBusy(true);
    const result = await enrollCourse(courseId, session.session_token);
    await refreshLearningState(session);

    if (result?.course) {
      setSelectedCourse(result.course);
      setSelectedLectureId(result.course.lectures[0]?.id ?? '');
      setSelectedLecture(result.course.lectures[0] ? await loadLectureDetail(result.course.lectures[0].id, session.session_token) : null);
    }

    setNotice('수강 신청이 완료되었습니다.');
    setBusy(false);
  }

  const highlightedLecture = selectedLecture ?? selectedCourse?.lectures[0] ?? null;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MyWayClass · 인증과 권한</p>
          <h1>학습자, 강사, 운영자를 구분하는 기본 권한 체계</h1>
          <p className="lead">
            같은 LMS라도 역할이 섞이면 책임이 흐려집니다. 이 화면은 로그인, 로그아웃, 내 정보, 역할 기반 접근 제어를
            먼저 보여주고, 그 위에 기본 LMS 코어를 얹습니다.
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
            <button className="action-button action-button--ghost" onClick={() => void handleLogout()} type="button">
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
                onClick={() => void handleLogin(user.id)}
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
          ) : (
            <p className="empty-state">로그인하면 내 정보와 진도, 수강 상태가 보입니다.</p>
          )}
        </div>
      </section>

      <section className="metrics">
        <article>
          <span>전체 강의</span>
          <strong>{dashboard?.total_courses ?? courseCards.length}</strong>
        </article>
        <article>
          <span>수강 중</span>
          <strong>{dashboard?.active_enrollments ?? 0}</strong>
        </article>
        <article>
          <span>평균 진도</span>
          <strong>{formatPercentage(dashboard?.average_progress ?? 0)}</strong>
        </article>
        <article>
          <span>권한 상태</span>
          <strong>{session ? '활성' : '제한됨'}</strong>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel panel--wide">
          <div className="panel__header">
            <div>
              <p className="section-label">강의 목록</p>
              <h2>수강할 코스를 선택하세요</h2>
            </div>
          </div>

          <div className="course-grid">
            {courseCards.map((course) => (
              <button
                key={course.id}
                className={`course-card ${course.id === selectedCourseId ? 'is-active' : ''}`}
                onClick={() => setSelectedCourseId(course.id)}
                type="button"
              >
                <span className="course-card__category">{course.category}</span>
                <strong>{course.title}</strong>
                <p>{course.description}</p>
                <dl>
                  <div>
                    <dt>난이도</dt>
                    <dd>{formatDifficulty(course.difficulty)}</dd>
                  </div>
                  <div>
                    <dt>강의</dt>
                    <dd>{course.lecture_count}개</dd>
                  </div>
                  <div>
                    <dt>진도</dt>
                    <dd>{formatPercentage(course.progress_percent)}</dd>
                  </div>
                </dl>
                <span className={`course-card__status ${course.enrolled ? 'is-enrolled' : ''}`}>
                  {course.enrolled ? '수강 중' : '미수강'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="section-label">강의 상세</p>
              <h2>{selectedCourse?.title ?? '강의를 선택하세요'}</h2>
            </div>

            <button
              className="action-button"
              disabled={busy || !selectedCourseId || !canEnrollCurrent}
              onClick={() => void handleEnroll(selectedCourseId)}
              type="button"
            >
              {busy ? '처리 중...' : canEnrollCurrent ? '수강 신청' : '권한 없음'}
            </button>
          </div>

          {selectedCourse ? (
            <>
              <p className="panel__description">{selectedCourse.description}</p>
              <div className="detail-grid">
                <article>
                  <span>강사</span>
                  <strong>{selectedCourse.instructor_name}</strong>
                </article>
                <article>
                  <span>난이도</span>
                  <strong>{formatDifficulty(selectedCourse.difficulty)}</strong>
                </article>
                <article>
                  <span>강의 수</span>
                  <strong>{selectedCourse.lecture_count}개</strong>
                </article>
                <article>
                  <span>완료</span>
                  <strong>{selectedCourse.completed_lectures}개</strong>
                </article>
              </div>

              <div className="lecture-list">
                {selectedCourse.lectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    className={`lecture-item ${lecture.id === selectedLectureId ? 'is-active' : ''}`}
                    onClick={() => setSelectedLectureId(lecture.id)}
                    type="button"
                  >
                    <span>
                      {lecture.order_index + 1}강 · {lecture.duration_minutes}분
                    </span>
                    <strong>{lecture.title}</strong>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="empty-state">선택한 강의의 상세 정보가 여기에 표시됩니다.</p>
          )}
        </div>
      </section>

      <section className="panel panel--lecture">
        <div className="panel__header">
          <div>
            <p className="section-label">강의 시청</p>
            <h2>{highlightedLecture?.title ?? '강의 영상을 선택하세요'}</h2>
          </div>
        </div>

        {highlightedLecture ? (
          <div className="lecture-detail">
            <div className="lecture-detail__meta">
              <span>{highlightedLecture.course_title}</span>
              <span>{highlightedLecture.course_instructor}</span>
            </div>
            <p>{highlightedLecture.content_text}</p>
            <div className="lecture-detail__nav">
              <button
                disabled={!highlightedLecture.previous_lecture_id}
                onClick={() => setSelectedLectureId(highlightedLecture.previous_lecture_id ?? selectedLectureId)}
                type="button"
              >
                이전 강의
              </button>
              <button
                disabled={!highlightedLecture.next_lecture_id}
                onClick={() => setSelectedLectureId(highlightedLecture.next_lecture_id ?? selectedLectureId)}
                type="button"
              >
                다음 강의
              </button>
            </div>
          </div>
        ) : (
          <p className="empty-state">선택한 강의가 없으면 여기에 미리보기 영역이 표시됩니다.</p>
        )}
      </section>
    </main>
  );
}
