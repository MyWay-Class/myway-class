export function CourseCreateCardLockedState() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <i className="ri-lock-line text-[18px]" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-slate-900">새 강의 개설</h3>
          <p className="mt-1 text-[12px] leading-6 text-slate-500">교수, 강사, 운영자 권한으로 로그인하면 새 강의를 개설할 수 있습니다.</p>
        </div>
      </div>
    </section>
  );
}
