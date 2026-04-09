import type { CourseDetail } from '@myway/shared';

type CourseSessionTimelineProps = {
  course: CourseDetail;
  selectedLectureId: string;
  onSelectLecture: (lectureId: string) => void;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

function formatSessionNumber(sessionNumber: number | undefined, orderIndex: number): number {
  return sessionNumber ?? orderIndex + 1;
}

export function CourseSessionTimeline({ course, selectedLectureId, onSelectLecture }: CourseSessionTimelineProps) {
  const grouped = course.lectures.reduce<Record<number, typeof course.lectures>>((accumulator, lecture) => {
    const week = lecture.week_number ?? 1;
    if (!accumulator[week]) {
      accumulator[week] = [];
    }

    accumulator[week].push(lecture);
    return accumulator;
  }, {});

  const weeks = Object.keys(grouped)
    .map(Number)
    .sort((left, right) => left - right);

  return (
    <div className="space-y-5">
      {weeks.map((week) => {
        const lectures = grouped[week] ?? [];

        return (
          <div key={week} className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-bold text-indigo-600">
                {week}
              </div>
              <h3 className="text-[15px] font-bold text-slate-700">{week}주차</h3>
              <span className="text-[12px] text-slate-400">{lectures.length}강의</span>
            </div>

            <div className="mt-4 ml-1 space-y-2 border-l-2 border-slate-100 pl-4">
              {lectures.map((lecture) => {
                const sessionNumber = formatSessionNumber(lecture.session_number, lecture.order_index);
                const active = lecture.id === selectedLectureId;

                return (
                  <button
                    key={lecture.id}
                    type="button"
                    onClick={() => onSelectLecture(lecture.id)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                      active ? 'border-indigo-200 bg-indigo-50/70' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                        lecture.is_completed
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}
                    >
                      {lecture.is_completed ? <i className="ri-check-line text-lg" /> : <span className="text-xs font-bold">{sessionNumber}차시</span>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                          {sessionNumber}차시
                        </span>
                        {lecture.is_completed ? (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                            완료
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[13px] font-semibold text-slate-900 group-hover:text-indigo-700">{lecture.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {lecture.content_type === 'video' ? <i className="ri-play-circle-line mr-1" /> : <i className="ri-file-text-line mr-1" />}
                        {formatDuration(lecture.duration_minutes)}
                      </p>
                    </div>

                    <i className="ri-arrow-right-s-line flex-shrink-0 text-slate-300 group-hover:text-indigo-400" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
