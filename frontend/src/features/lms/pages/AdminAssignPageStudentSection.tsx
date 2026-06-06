type AdminAssignPageStudentSectionProps = {
  query: string;
  instructorsCount: number;
  studentsCount: number;
  filteredStudents: Array<{ id: string; name: string; department: string }>;
  assignedStudentIds: string[];
  assignedSet: Set<string>;
  saving: boolean;
  onQueryChange: (query: string) => void;
  onToggleStudent: (studentId: string) => void;
  onPersistAssignment: () => void;
  onResetSelection: () => void;
};

export function AdminAssignPageStudentSection({
  query,
  instructorsCount,
  studentsCount,
  filteredStudents,
  assignedStudentIds,
  assignedSet,
  saving,
  onQueryChange,
  onToggleStudent,
  onPersistAssignment,
  onResetSelection,
}: AdminAssignPageStudentSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
      <h2 className="text-[15px] font-bold text-slate-900">수강생 그룹</h2>
      <p className="mt-1 text-[12px] text-slate-500">운영자가 역할별 분포와 수강생 배정 대상을 빠르게 확인할 수 있습니다.</p>
      <label className="mt-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">수강생 검색</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="이름, 부서, 이메일"
          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300"
        />
      </label>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-500">교강사</div>
          <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{instructorsCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="text-[12px] font-semibold text-slate-500">수강생</div>
          <div className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-slate-900">{studentsCount}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {filteredStudents.slice(0, 8).map((student) => (
          <div key={student.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="ri-user-line" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-900">{student.name}</div>
              <div className="mt-0.5 text-[12px] text-slate-500">{student.department}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggleStudent(student.id)}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
            >
              {assignedSet.has(student.id) ? '배정됨' : '배정 후보'}
            </button>
          </div>
        ))}
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-[12px] text-slate-500">검색 조건에 맞는 수강생이 없습니다.</div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPersistAssignment}
          disabled={!assignedStudentIds.length || saving}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? '배정 저장 중...' : `선택 인원 배정 저장 (${assignedStudentIds.length})`}
        </button>
        <button
          type="button"
          onClick={onResetSelection}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
        >
          선택 초기화
        </button>
      </div>
    </section>
  );
}
