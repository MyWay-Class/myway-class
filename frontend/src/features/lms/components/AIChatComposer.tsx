type AIChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  quickPrompts: string[];
  onQuickPrompt: (prompt: string) => void;
  disabled?: boolean;
};

export function AIChatComposer({ value, onChange, onSubmit, quickPrompts, onQuickPrompt, disabled = false }: AIChatComposerProps) {
  return (
    <div className="border-t border-slate-200 px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] text-slate-400">
        <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
        <span>질문은 짧게 적어도 됩니다.</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onQuickPrompt(prompt)}
            className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-200"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          rows={2}
          placeholder="핵심 개념, 시험 대비, 이전 강의와 연결 같은 질문을 입력하세요..."
          className="min-h-[56px] flex-1 resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-indigo-300 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="flex h-[56px] w-[56px] items-center justify-center rounded-[22px] bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <i className="ri-send-plane-fill" />
        </button>
      </div>
    </div>
  );
}
