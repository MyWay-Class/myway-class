import { useEffect, useMemo, useState } from 'react';
import { type CourseCard, type CourseDetail, type Dashboard, type LectureDetail } from '@myway/shared';
import { enrollCourse, loadCourseDetail, loadDashboard, loadLectureDetail } from './lib/api';

const DEMO_USER_ID = 'usr_std_001';

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
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [selectedLecture, setSelectedLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('기본 LMS 코어를 불러오는 중입니다.');

  const courseCards = dashboard?.courses ?? [];

  const selectedCourseCard = useMemo(
    () => courseCards.find((course) => course.id === selectedCourseId) ?? null,
    [courseCards, selectedCourseId],
  );

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);

      const dashboardData = await loadDashboard(DEMO_USER_ID);
      const firstCourseId = dashboardData.courses[0]?.id ?? '';

      if (!active) {
        return;
      }

      setDashboard(dashboardData);
      setSelectedCourseId((current) => current || firstCourseId);
      setNotice('기본 LMS 코어를 불러왔습니다.');
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
      const course = await loadCourseDetail(selectedCourseId, DEMO_USER_ID);

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
  }, [selectedCourseId]);

  useEffect(() => {
    if (!selectedLectureId) {
      setSelectedLecture(null);
      return;
    }

    let active = true;

    async function loadSelectedLecture() {
      const lecture = await loadLectureDetail(selectedLectureId);

      if (!active) {
        return;
      }

      setSelectedLecture(lecture);
    }

    void loadSelectedLecture();

    return () => {
      active = false;
    };
  }, [selectedLectureId]);

  async function handleEnroll(courseId: string) {
    setSaving(true);

    const result = await enrollCourse(DEMO_USER_ID, courseId);
    const dashboardData = await loadDashboard(DEMO_USER_ID);
    const courseData = await loadCourseDetail(courseId, DEMO_USER_ID);

    setDashboard(dashboardData);
    setSelectedCourse(courseData);
    setSelectedCourseId(courseId);
    setSelectedLectureId(courseData?.lectures[0]?.id ?? '');
    setSelectedLecture(result.course?.lectures[0] ? await loadLectureDetail(result.course.lectures[0].id) : null);
    setNotice('수강 신청이 완료되었습니다.');
    setSaving(false);
  }

  const highlightedLecture = selectedLecture ?? selectedCourse?.lectures[0] ?? null;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MyWayClass · 기본 LMS 코어</p>
          <h1>강의를 보고, 수강하고, 진도를 이어가는 학습 시작점</h1>
          <p className="lead">
            내맘대로클래스는 기본 LMS 위에 강의 숏폼화와 커스텀 강의를 얹는 플랫폼입니다. 지금 화면은 그 바닥이 되는
            수강, 강의, 진도, 자료 흐름을 먼저 보여줍니다.
          </p>
        </div>

        <aside className="hero-panel">
          <span className="hero-panel__label">{loading ? '로딩 중' : '준비 완료'}</span>
          <strong>{notice}</strong>
          <p>
            현재 사용자: <code>{DEMO_USER_ID}</code>
          </p>
          <p>
            연결 상태: <code>{dashboard ? '데모 데이터 또는 API 연결 성공' : '초기화 실패'}</code>
          </p>
        </aside>
      </section>

      <section className="metrics">
        <article>
          <span>전체 강의</span>
          <strong>{dashboard?.total_courses ?? 0}</strong>
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
          <span>역할</span>
          <strong>{dashboard?.role ?? 'STUDENT'}</strong>
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

            {!selectedCourseCard?.enrolled ? (
              <button
                className="action-button"
                disabled={saving || !selectedCourseId}
                onClick={() => void handleEnroll(selectedCourseId)}
                type="button"
              >
                {saving ? '신청 중...' : '수강 신청'}
              </button>
            ) : null}
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
