import type { LectureStudioDraft } from './types';

type ChoiceGridProps<T extends string> = {
  title: string;
  description: string;
  value: T;
  options: Array<{ value: T; label: string; hint: string }>;
  onChange: (value: T) => void;
};

export function ChoiceGrid<T extends string>({ title, description, value, options, onChange }: ChoiceGridProps<T>) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-[12px] leading-6 text-slate-500">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] ${
                active ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{option.label}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{option.hint}</div>
                </div>
                {active ? <i className="ri-checkbox-circle-fill text-[18px] text-indigo-600" /> : <i className="ri-checkbox-blank-circle-line text-[18px] text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TogglePill({
  label,
  checked,
  hint,
  onToggle,
}: {
  label: string;
  checked: boolean;
  hint: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
        checked ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="mt-1 text-[12px] leading-6 opacity-80">{hint}</div>
      </div>
      <div className={`flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}

export function updateDraft<K extends keyof LectureStudioDraft>(draft: LectureStudioDraft, onChange: (next: LectureStudioDraft) => void, key: K, value: LectureStudioDraft[K]) {
  onChange({ ...draft, [key]: value });
}
