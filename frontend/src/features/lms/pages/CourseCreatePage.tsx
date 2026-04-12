import type { CourseCard, CourseCreateRequest, CourseDetail } from '@myway/shared';
import type { LmsPageId } from '../types';
import { CourseCreateCard } from '../components/CourseCreateCard';

type CourseCreatePageProps = {
  courses: CourseCard[];
  canManageCurrent: boolean;
  busy: boolean;
  onCreateCourse: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
  onNavigate: (page: LmsPageId) => void;
};

export function CourseCreatePage({
  courses,
  canManageCurrent,
  busy,
  onCreateCourse,
  onSelectCourse,
  onSelectLecture,
  onNavigate,
}: CourseCreatePageProps) {
  const categoryCount = new Set(courses.map((item) => item.category)).size;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_58%,#4338ca_100%)] px-6 py-6 text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-add-circle-line" />
              강의 개설 워크스페이스
            </div>
            <h1 className="mt-4 text-[28px] font-extrabold tracking-[-0.05em]">새 강의를 쉽게 만들고 바로 제작 흐름으로 넘기기</h1>
            <p className="mt-2 text-[13px] leading-7 text-white/75">
              교수, 강사, 운영자가 배포 환경에서도 새 강의를 직접 개설하고, 첫 차시와 기본 자료/공지 초안을 함께 만들 수 있는 진입점입니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">현재 강의 수</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">{courses.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">카테고리</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">{categoryCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] text-slate-200">
              <div className="font-semibold text-white">진입 방식</div>
              <div className="mt-1 text-[18px] font-extrabold text-white">전용 페이지</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <CourseCreateCard
          canCreate={canManageCurrent}
          busy={busy}
          onCreate={onCreateCourse}
          onCreated={(course) => {
            onSelectCourse(course.id);
            onSelectLecture(course.lectures[0]?.id ?? '');
            onNavigate('lecture-studio');
          }}
        />

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-bold text-slate-900">처음 만들 때 안내</h2>
            <div className="mt-4 space-y-3 text-[12px] leading-6 text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">1. 제목과 소개만 먼저 넣어도 바로 시작할 수 있습니다.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">2. 차시는 한 줄씩 적으면 입력한 순서대로 등록됩니다.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">3. 만들고 나면 강의 스튜디오로 곧바로 이어집니다.</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">4. 이후 영상 업로드와 STT 자동화까지 연결됩니다.</div>
            </div>
          </section>

          <section className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50 px-5 py-5 text-[12px] leading-6 text-indigo-900">
            <div className="font-bold">권한 안내</div>
            <p className="mt-2 text-indigo-800">
              {canManageCurrent
                ? '현재 계정은 강의 개설 권한이 있습니다.'
                : '현재 계정은 강의 개설 권한이 없습니다. 관리자 또는 강사 계정으로 전환해 주세요.'}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="mt-4 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
            >
              강의 목록으로 돌아가기
            </button>
          </section>
        </aside>
      </section>
    </div>
  );
}
