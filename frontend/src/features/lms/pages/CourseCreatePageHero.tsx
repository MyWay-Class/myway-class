import type { CourseCard } from '@myway/shared';

export function CourseCreateHero({ courses, categoryCount, workspaceNote }: { courses: CourseCard[]; categoryCount: number; workspaceNote: string }) {
  return (
    <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur"><i className="ri-add-circle-line" />강좌개설</div>
          <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.05em]">새 강좌를 입력하고, 개설과 스튜디오를 한 번에 이어가기</h1>
          <p className="mt-2 text-[13px] leading-7 text-white/75">교수, 강사, 운영자가 개설 정보를 먼저 입력하고 다음 단계로 넘어가면, 그 정보 그대로 강의를 개설하고 제작 스튜디오로 이어갈 수 있습니다.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricBox label="현재 강의 수" value={courses.length} />
          <MetricBox label="카테고리" value={categoryCount} />
          <MetricBox label="진입 방식" value="2단계 워크플로우" />
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] leading-6 text-slate-200">{workspaceNote}</div>
    </section>
  );
}

function MetricBox({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200"><div className="font-semibold text-white">{label}</div><div className="mt-1 text-[18px] font-extrabold text-white">{value}</div></div>;
}
