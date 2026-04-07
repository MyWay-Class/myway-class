import type { CourseCard, CourseDetail, Dashboard } from '@myway/shared';
import { formatDifficulty, formatPercentage } from '../../lib/format';

type CatalogPanelProps = {
  busy: boolean;
  canEnrollCurrent: boolean;
  courseCards: CourseCard[];
  dashboard: Dashboard | null;
  selectedCourseId: string;
  selectedCourse: CourseDetail | null;
  selectedLectureId: string;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onEnroll: (courseId: string) => void;
};

export function CatalogPanel({
  busy,
  canEnrollCurrent,
  courseCards,
  dashboard,
  selectedCourseId,
  selectedCourse,
  selectedLectureId,
  onSelectCourse,
  onSelectLecture,
  onEnroll,
}: CatalogPanelProps) {
  return (
    <section className="content-grid">
      <div className="panel panel--wide">
        <div className="panel__header">
          <div>
            <p className="section-label">학습 현황</p>
            <h2>지금 학습 흐름을 빠르게 확인하세요</h2>
          </div>
        </div>

        <div className="metrics">
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
            <strong>{dashboard ? '활성' : '제한됨'}</strong>
          </article>
        </div>

        <div className="course-grid">
          {courseCards.map((course) => (
            <button
              key={course.id}
              className={`course-card ${course.id === selectedCourseId ? 'is-active' : ''}`}
              onClick={() => onSelectCourse(course.id)}
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
            disabled={busy || !selectedCourseId || !canEnrollCurrent || Boolean(selectedCourse?.enrolled)}
            onClick={() => onEnroll(selectedCourseId)}
            type="button"
          >
            {busy ? '처리 중...' : selectedCourse?.enrolled ? '수강 중' : canEnrollCurrent ? '수강 신청' : '권한 없음'}
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
                  onClick={() => onSelectLecture(lecture.id)}
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
  );
}
