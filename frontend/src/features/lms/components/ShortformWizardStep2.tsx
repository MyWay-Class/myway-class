import { StatePanel } from './StatePanel';
import type { ClipSuggestion } from './ShortformWizardTypes';

type ShortformWizardStep2Props = {
  lectureFilter: string;
  lectureTabs: Array<{ id: string; title: string; label: string }>;
  filteredSuggestions: ClipSuggestion[];
  selectedClipKeys: string[];
  onBack: () => void;
  onNext: () => void;
  onToggleClip: (clip: ClipSuggestion) => void;
  onFilterChange: (lectureId: string) => void;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function ShortformWizardStep2({
  lectureFilter,
  lectureTabs,
  filteredSuggestions,
  selectedClipKeys,
  onBack,
  onNext,
  onToggleClip,
  onFilterChange,
}: ShortformWizardStep2Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <i className="ri-scissors-cut-line text-[18px] text-cyan-500" />
            <h2 className="text-[16px] font-semibold text-slate-900">2단계 · 구간 선택</h2>
          </div>
          <p className="mt-1 text-[12px] text-slate-500">레퍼런스처럼 차시 필터 탭으로 구간을 좁히고, 핵심 구간을 카드 단위로 선택합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-600">
            선택 {selectedClipKeys.length}개
          </span>
          <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-600">
            이전
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className={`inline-flex h-9 items-center rounded-lg px-3 text-[12px] font-semibold whitespace-nowrap ${
            lectureFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          전체 차시
        </button>
        {lectureTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange(tab.id)}
            className={`inline-flex h-9 items-center rounded-lg px-3 text-[12px] font-semibold whitespace-nowrap ${
              lectureFilter === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-slate-500">AI가 추천한 핵심 구간입니다. 클릭하여 선택/해제하세요.</p>

      <div className="mt-4 space-y-2.5">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((clip, index) => {
            const key = `${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`;
            const selected = selectedClipKeys.includes(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleClip(clip)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                  selected ? 'border-cyan-300 bg-cyan-50/70' : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40'
                }`}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-500">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{clip.lecture_title}</span>
                    {selected ? <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">선택됨</span> : null}
                  </div>
                  <p className="mt-1 text-[13px] font-semibold text-slate-900">{clip.label}</p>
                  <p className="mt-1 text-[12px] leading-6 text-slate-500">{clip.description}</p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {formatDuration(clip.start_time_ms)} ~ {formatDuration(clip.end_time_ms)}
                  </p>
                </div>
                <i className="ri-arrow-right-s-line flex-shrink-0 text-slate-300" />
              </button>
            );
          })
        ) : (
          <StatePanel compact icon="ri-film-line" tone="slate" title="선택 가능한 구간이 없습니다." description="다른 강좌를 선택하거나 강의 정보를 확인해보세요." />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-600">
          이전
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedClipKeys.length === 0}
          className="inline-flex h-10 items-center rounded-lg bg-cyan-600 px-4 text-[12px] font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
        >
          다음: 미리보기 <i className="ri-arrow-right-line ml-1" />
        </button>
      </div>
    </article>
  );
}

