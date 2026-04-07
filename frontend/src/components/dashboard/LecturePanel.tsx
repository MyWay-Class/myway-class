import type { CourseDetail, LectureDetail, LoginResponse } from '@myway/shared';

type LecturePanelProps = {
  busy: boolean;
  session: LoginResponse | null;
  selectedCourse: CourseDetail | null;
  selectedLectureId: string;
  highlightedLecture: LectureDetail | null;
  onSelectLecture: (lectureId: string) => void;
  onCompleteLecture: (lectureId: string) => void;
};

export function LecturePanel({
  busy,
  session,
  selectedCourse,
  selectedLectureId,
  highlightedLecture,
  onSelectLecture,
  onCompleteLecture,
}: LecturePanelProps) {
  return (
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
            {selectedCourse ? <span>{selectedCourse.progress_percent}% 완료</span> : null}
          </div>
          <p>{highlightedLecture.content_text}</p>
          <div className="lecture-detail__actions">
            <button
              className="action-button"
              disabled={busy || !session || !selectedCourse?.enrolled || Boolean(highlightedLecture.is_completed)}
              onClick={() => onCompleteLecture(highlightedLecture.id)}
              type="button"
            >
              {highlightedLecture.is_completed ? '완료됨' : selectedCourse?.enrolled ? '강의 완료' : '수강 후 가능'}
            </button>
          </div>
          <div className="lecture-detail__nav">
            <button
              disabled={!highlightedLecture.previous_lecture_id}
              onClick={() => onSelectLecture(highlightedLecture.previous_lecture_id ?? selectedLectureId)}
              type="button"
            >
              이전 강의
            </button>
            <button
              disabled={!highlightedLecture.next_lecture_id}
              onClick={() => onSelectLecture(highlightedLecture.next_lecture_id ?? selectedLectureId)}
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
  );
}
