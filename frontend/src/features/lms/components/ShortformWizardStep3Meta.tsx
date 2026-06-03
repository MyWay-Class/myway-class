type ShortformWizardStep3MetaProps = {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function ShortformWizardStep3Meta({ title, description, onTitleChange, onDescriptionChange }: ShortformWizardStep3MetaProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-slate-500">
          숏폼 제목 <span className="text-rose-500">*</span>
        </label>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none transition focus:border-cyan-300 focus:bg-white"
          placeholder="예: AI 1주차 핵심 요약"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-slate-500">설명 <span className="text-xs text-slate-400">(선택)</span></label>
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          className="h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 outline-none transition focus:border-cyan-300 focus:bg-white"
          placeholder="숏폼에 대한 간단한 설명"
        />
      </div>
    </div>
  );
}
