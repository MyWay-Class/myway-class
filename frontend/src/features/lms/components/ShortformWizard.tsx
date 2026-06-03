import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { ShortformWizardSidebar } from './ShortformWizardSidebar';
import { ShortformWizardStep1 } from './ShortformWizardStep1';
import { ShortformWizardStep2 } from './ShortformWizardStep2';
import { ShortformWizardStep3 } from './ShortformWizardStep3';
import { useShortformWizardState } from './useShortformWizardState';

type ShortformWizardProps = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

export function ShortformWizard({ highlightedLecture, selectedCourse, courses, sessionToken }: ShortformWizardProps) {
  const wizard = useShortformWizardState({ highlightedLecture, selectedCourse, courses, sessionToken });

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-cyan-200/20 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.24),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.32),transparent_42%),linear-gradient(135deg,#071a35_0%,#123f66_52%,#175479_100%)] px-6 py-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-scissors-cut-line" />
              숏폼 제작 허브
            </div>
            <h1 className="mt-3 text-[24px] font-bold lg:text-[28px]">숏폼 제작 워크플로우</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/75">강좌 선택, 추천 구간 선택, 미리보기 저장을 하나의 흐름으로 정리해 중간에 길을 잃지 않도록 바꿨습니다.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">현재 강좌</div><div className="mt-1">{wizard.courseDetail?.title ?? '강좌 선택 필요'}</div></div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">선택 클립</div><div className="mt-1">{wizard.selectedClips.length}개 · {wizard.totalDurationLabel}</div></div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">현재 단계</div><div className="mt-1">{wizard.stepLabel}</div></div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">차시 바로 시작</div><div className="mt-1">현재 보고 있는 강의에서 곧바로 구간을 좁힐 수 있습니다.</div></div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">추천 구간 확인</div><div className="mt-1">차시별 추천 후보를 탭으로 빠르게 좁힙니다.</div></div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-[12px] text-slate-200 backdrop-blur"><div className="font-semibold text-white">저장 전 확인</div><div className="mt-1">미리보기와 제목을 마지막에 정리할 수 있습니다.</div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">제작 단계</h2>
            <p className="mt-2 text-[13px] leading-6 text-slate-500">강좌 선택 → 차시별 구간 선택 → 제목/미리보기/저장의 3단계로 정리했습니다.</p>
          </div>
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">{wizard.selectedClips.length}개 클립</span>
        </div>

        <div className="mt-5 flex items-center gap-0 overflow-x-auto pb-1">
          {(['강좌 선택', '구간 선택', '미리보기 / 저장'] as const).map((label, index) => {
            const current = (index + 1) as 1 | 2 | 3;
            const active = wizard.step === current;
            const completed = wizard.step > current;
            return (
              <div key={label} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                {index > 0 ? <div className={`mx-2 h-0.5 flex-1 rounded ${completed || active ? 'bg-cyan-500' : 'bg-slate-200'}`} /> : null}
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? 'bg-emerald-500 text-white' : active ? 'bg-cyan-600 text-white ring-4 ring-cyan-100' : 'bg-slate-200 text-slate-500'}`}>
                    {completed ? <i className="ri-check-line" /> : index + 1}
                  </div>
                  <span className={`hidden text-xs font-medium sm:inline ${active ? 'text-cyan-700' : 'text-slate-400'}`}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          {wizard.step === 1 ? <ShortformWizardStep1 courses={courses} activeCourseId={wizard.activeCourseId} courseTitle={wizard.courseDetail?.title ?? null} highlightedLecture={highlightedLecture} onSelectCourse={(courseId) => wizard.setActiveCourseId(courseId)} onUseHighlightedLecture={() => { if (highlightedLecture?.id) wizard.setLectureFilter(highlightedLecture.id); wizard.setStep(2); }} onNext={() => wizard.setStep(2)} canContinue={wizard.courseLectures.length > 0} /> : null}
          {wizard.step === 2 ? <ShortformWizardStep2 lectureFilter={wizard.lectureFilter} lectureTabs={wizard.lectureTabs} filteredSuggestions={wizard.filteredSuggestions} selectedClipKeys={wizard.selectedClipKeys} onBack={() => wizard.setStep(1)} onNext={() => wizard.setStep(3)} onToggleClip={wizard.toggleClip} onFilterChange={wizard.setLectureFilter} /> : null}
          {wizard.step === 3 ? <ShortformWizardStep3 courseTitle={wizard.courseDetail?.title ?? null} selectedClips={wizard.selectedClips} title={wizard.title} description={wizard.description} createdVideoId={wizard.createdVideo?.id ?? null} previewVideoUrl={wizard.previewVideoUrl} exportStatus={wizard.createdVideo?.export_status ?? null} status={wizard.status} onBack={() => wizard.setStep(2)} onSave={() => void wizard.handleCompose()} onShare={() => void wizard.handleShare()} onRemoveClip={wizard.removeClip} onUpdateClipTimes={wizard.updateClipTimes} onTitleChange={wizard.setTitle} onDescriptionChange={wizard.setDescription} formatDuration={wizard.formatDuration} /> : null}
        </section>

        <ShortformWizardSidebar courseTitle={wizard.courseDetail?.title ?? null} selectedClipsCount={wizard.selectedClips.length} selectedDurationLabel={wizard.totalDurationLabel} highlightedLectureTitle={highlightedLecture?.title ?? null} communityItems={wizard.communityItems} />
      </div>
    </div>
  );
}
