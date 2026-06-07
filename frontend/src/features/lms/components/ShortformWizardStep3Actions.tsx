type ShortformWizardStep3ActionsProps = {
  status: string;
  createdVideoId: string | null;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
};

export function ShortformWizardStep3Actions({ status, createdVideoId, onBack, onSave, onShare }: ShortformWizardStep3ActionsProps) {
  return (
    <>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onSave} className="inline-flex h-10 items-center rounded-lg bg-cyan-600 px-4 text-[12px] font-semibold text-white">
          숏폼 생성
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={!createdVideoId}
          className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 disabled:pointer-events-none disabled:opacity-50"
        >
          공유하기
        </button>
        <button type="button" onClick={onBack} className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-[12px] font-semibold text-slate-600">
          이전
        </button>
      </div>
      <p className="text-[12px] leading-6 text-slate-500">{status}</p>
    </>
  );
}
