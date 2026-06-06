import type { CourseDetail, LectureDetail } from '@myway/shared';

export function LectureWatchHero({ selectedCourse, currentLecture, canManageCurrent }: { selectedCourse: CourseDetail; currentLecture: LectureDetail | null; canManageCurrent: boolean }) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-7 text-white shadow-[0_30px_70px_rgba(8,47,73,0.28)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
            <i className="ri-play-circle-line" />영상 시청
          </div>
          <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[30px]">{selectedCourse.title}</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">{currentLecture?.title ?? '차시를 선택하세요'} · {selectedCourse.category} · {selectedCourse.progress_percent}% 진행</p>
        </div>
        <div className="rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold text-white/90 backdrop-blur">{canManageCurrent ? '교강사 시청 모드' : '학습자 시청 모드'}</div>
      </div>
    </section>
  );
}
