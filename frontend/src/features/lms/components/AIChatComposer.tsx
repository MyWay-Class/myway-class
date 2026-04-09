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
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          placeholder="질문을 입력하세요..."
          className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[13px] text-slate-700 outline-none transition focus:border-indigo-300 disabled:bg-slate-50"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-50"
        >
          <i className="ri-send-plane-fill" />
        </button>
      </div>
    </div>
  );
}
