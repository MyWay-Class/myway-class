import type { WorkspaceTab } from './useCourseCreateWorkspace';

export const tabList: Array<{ id: WorkspaceTab; label: string; hint: string; icon: string }> = [
  { id: 'create', label: '강의 개설', hint: '기본 정보와 첫 차시를 등록합니다.', icon: 'ri-add-circle-line' },
  { id: 'studio', label: '제작 스튜디오', hint: '강의 개설 후 세부 옵션과 자동 처리를 이어갑니다.', icon: 'ri-layout-masonry-line' },
];

export const stepLabels: Record<WorkspaceTab, string> = {
  create: '1. 강의 개설',
  studio: '2. 제작 스튜디오',
};

export function CourseCreateTabs({ activeTab, onChange }: { activeTab: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  return (
    <section className="rounded-3xl border border-[#d6e6f5] bg-white p-2 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="grid gap-2 md:grid-cols-2">
        {tabList.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`rounded-2xl border px-4 py-4 text-left transition ${active ? 'border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100' : 'border-slate-200 bg-slate-50/70 hover:bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><div className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-900"><i className={tab.icon} />{tab.label}</div><div className="mt-1 text-[12px] leading-6 text-slate-500">{tab.hint}</div></div>
                {active ? <i className="ri-checkbox-circle-fill text-[18px] text-cyan-600" /> : <i className="ri-checkbox-blank-circle-line text-[18px] text-slate-300" />}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CourseCreateStepBanner({ activeTab }: { activeTab: WorkspaceTab }) {
  return <section className="rounded-3xl border border-[#d6e6f5] bg-white px-5 py-4 shadow-[0_14px_30px_rgba(6,31,57,0.08)]"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">진행 단계</div><div className="mt-1 text-[14px] font-bold text-slate-900">{stepLabels[activeTab]}</div></div><div className="text-[12px] leading-6 text-slate-500">입력한 정보는 탭을 옮겨도 유지되고, 다음 단계에서 강의 개설과 자동 전사 처리가 이어집니다.</div></div></section>;
}
