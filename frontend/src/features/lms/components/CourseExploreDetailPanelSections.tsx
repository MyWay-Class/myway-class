import type { CourseDetail } from '@myway/shared';
import { StatePanel } from './StatePanel';

export function formatDisplayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function renderNoticeList(course: CourseDetail) {
  const notices = Array.isArray(course.notices) ? course.notices : [];
  if (notices.length === 0) {
    return (
      <StatePanel
        compact
        icon="ri-megaphone-line"
        tone="slate"
        title="등록된 공지가 없습니다."
        description="공지사항이 추가되면 이 영역에서 최신 안내를 바로 확인할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cyan-200/30 bg-cyan-50/70 px-4 py-3">
        <div className="text-[12px] font-semibold text-cyan-800">공지 요약</div>
        <div className="mt-1 text-[12px] text-cyan-700">총 {notices.length}건 · 중요 공지는 상단 고정되어 먼저 보입니다.</div>
      </div>
      {notices.map((notice) => (
        <article key={notice.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${notice.pinned ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}>
                <i className={notice.pinned ? 'ri-pushpin-fill' : 'ri-megaphone-line'} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-slate-900">{notice.title}</p>
                  {notice.pinned ? <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700">고정</span> : null}
                </div>
                <p className="mt-2 whitespace-pre-line text-[12px] leading-6 text-slate-500">{notice.content}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-[11px] text-slate-400">{formatDisplayDate(notice.created_at)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function renderMaterialList(
  course: CourseDetail,
  canManageCurrent: boolean,
  onOpenMaterial: (fileName: string) => void,
  onNavigateStudio: () => void,
) {
  const materials = Array.isArray(course.materials) ? course.materials : [];
  if (materials.length === 0) {
    return (
      <StatePanel compact icon="ri-folder-line" tone="amber" title="등록된 자료가 없습니다." description="강의 자료가 올라오면 파일명, 요약, 업로드 시점을 함께 보여줍니다." />
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cyan-200/30 bg-cyan-50/70 px-4 py-3">
        <div className="text-[12px] font-semibold text-cyan-800">자료실</div>
        <div className="mt-1 text-[12px] text-cyan-700">총 {materials.length}건 · 파일명과 업로드일을 기준으로 빠르게 찾을 수 있습니다.</div>
      </div>
      {materials.map((material) => (
        <article key={material.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[18px] text-cyan-700 shadow-sm">
              <i className="ri-file-pdf-2-line" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-slate-900">{material.title}</p>
                <span className="text-[11px] text-slate-400">{formatDisplayDate(material.uploaded_at)}</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-cyan-700">{material.file_name}</p>
              <p className="mt-2 text-[12px] leading-6 text-slate-500">{material.summary}</p>
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onOpenMaterial(material.file_name)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700">
                    파일명 복사
                  </button>
                  {canManageCurrent ? (
                    <button type="button" onClick={onNavigateStudio} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100">
                      강의 스튜디오 이동
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
