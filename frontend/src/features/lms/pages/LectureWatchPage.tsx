import type { CourseDetail, LectureDetail } from '@myway/shared';
import { CourseExploreDetailPanel } from '../components/CourseExploreDetailPanel';

type LectureWatchPageProps = {
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: 'courses' | 'lecture-watch' | 'shortform' | 'ai-chat' | 'course-create' | 'lecture-studio' | 'media-pipeline') => void;
};

export function LectureWatchPage({
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  onSelectLecture,
  onNavigate,
}: LectureWatchPageProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-play-circle-line" />
              강의 시청
            </div>
            <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[30px]">
              강의는 여기서 보고, 상세는 한 단계 뒤로
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">
              시청 화면은 재생, 메모, 다음 차시 이동에 집중하고, 강의 소개와 공지는 상세 페이지에서 이어서 볼 수 있게 분리했습니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">선택 강의</div>
              <div className="mt-1">{selectedCourse?.title ?? '강의 미선택'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 차시</div>
              <div className="mt-1">{highlightedLecture?.title ?? '차시 미선택'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">역할</div>
              <div className="mt-1">{canManageCurrent ? '교강사 시청 모드' : '학습자 시청 모드'}</div>
            </div>
          </div>
        </div>
      </section>

      <CourseExploreDetailPanel
        course={selectedCourse}
        highlightedLecture={highlightedLecture}
        selectedLectureId={selectedLectureId}
        viewMode="watch"
        activeTab="강의"
        canManageCurrent={canManageCurrent}
        onSelectLecture={onSelectLecture}
        onTabChange={() => undefined}
        onNavigate={onNavigate}
      />
    </div>
  );
}
