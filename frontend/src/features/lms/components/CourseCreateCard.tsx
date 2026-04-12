import { useState, type FormEvent } from 'react';
import type { CourseCreateRequest, CourseDetail } from '@myway/shared';

type CourseCreateCardProps = {
  canCreate: boolean;
  busy: boolean;
  submitLabel?: string;
  submitMode?: 'create' | 'prepare';
  onCreate: (input: CourseCreateRequest) => Promise<CourseDetail | null>;
  onPrepare?: (input: CourseCreateRequest) => void;
  onCreated?: (course: CourseDetail) => void;
};

type FormState = {
  title: string;
  description: string;
  category: string;
  difficulty: CourseCreateRequest['difficulty'];
  lectureTitlesText: string;
  isPublished: boolean;
};

const defaultState: FormState = {
  title: '',
  description: '',
  category: 'AI',
  difficulty: 'intermediate',
  lectureTitlesText: '1. 개요\n2. 핵심 개념\n3. 실습',
  isPublished: true,
};

function splitLectureTitles(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*\d+[.)\-\s]*/, '').trim())
    .filter(Boolean);
}

export function CourseCreateCard({ canCreate, busy, submitLabel, submitMode = 'create', onCreate, onPrepare, onCreated }: CourseCreateCardProps) {
  const [form, setForm] = useState<FormState>(defaultState);
  const [message, setMessage] = useState(
    submitMode === 'prepare'
      ? '기본 정보를 입력한 뒤 다음 단계로 이동해 주세요.'
      : '기본 정보만 채우면 강의를 바로 만들 수 있습니다.',
  );
  const lectureCount = splitLectureTitles(form.lectureTitlesText).length;

  if (!canCreate) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setMessage('제목, 설명, 카테고리를 먼저 채워 주세요.');
      return;
    }

    const input: CourseCreateRequest = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      difficulty: form.difficulty,
      is_published: form.isPublished,
      lecture_titles: splitLectureTitles(form.lectureTitlesText),
    };

    if (submitMode === 'prepare') {
      onPrepare?.(input);
      setMessage('기본 정보를 저장했습니다. 다음 단계에서 강의 개설을 완료해 주세요.');
      return;
    }

    const result = await onCreate(input);

    if (!result) {
      setMessage('새 강의 개설에 실패했습니다. 다시 시도해 주세요.');
      return;
    }

    setForm(defaultState);
    setMessage(`${result.title} 강의를 개설했습니다.`);
    onCreated?.(result);
  }

  return (
    <section className="rounded-3xl border border-indigo-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eff6ff_100%)] px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
            <i className="ri-add-circle-line" />
            강의 개설
          </div>
          <h3 className="mt-3 text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">기본 정보만 넣고 바로 강의 만들기</h3>
          <p className="mt-2 text-[12px] leading-6 text-slate-600">
            제목, 소개, 분류, 난이도, 차시 제목만 입력하면 기본 자료와 공지가 함께 생성되고, 만들자마자 제작 스튜디오로 이어집니다.
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white/80 px-4 py-3 text-[12px] text-slate-500">
          <div className="font-semibold text-slate-900">생성 후 다음 단계</div>
          <div className="mt-1 leading-6">개설 워크스페이스 · 제작 스튜디오</div>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 grid gap-4 xl:grid-cols-2">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">강의 제목</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400"
            placeholder="예: 데이터 시각화 입문"
          />
        </label>
        <label className="space-y-2 xl:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">강의 설명</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 outline-none transition focus:border-indigo-400"
            placeholder="강의의 목적과 학습 포인트를 간단히 적어 주세요."
          />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">카테고리</span>
          <input
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400"
            placeholder="AI / Web / Data"
          />
        </label>
        <label className="space-y-2">
          <span className="text-[12px] font-semibold text-slate-700">난이도</span>
          <select
            value={form.difficulty}
            onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as FormState['difficulty'] }))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none transition focus:border-indigo-400"
          >
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </label>
        <label className="space-y-2 xl:col-span-2">
          <span className="text-[12px] font-semibold text-slate-700">차시 제목</span>
          <textarea
            value={form.lectureTitlesText}
            onChange={(event) => setForm((current) => ({ ...current, lectureTitlesText: event.target.value }))}
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 outline-none transition focus:border-indigo-400"
            placeholder="한 줄에 하나씩 입력하세요. 예: 1주차 개요 / 2주차 핵심 / 3주차 실습"
          />
          <div className="text-[11px] leading-5 text-slate-500">빈 줄은 자동으로 제외되고, 입력한 순서대로 차시가 만들어집니다.</div>
        </label>
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 xl:col-span-2">
          <div>
            <div className="text-[13px] font-semibold text-slate-900">즉시 공개</div>
            <div className="mt-1 text-[12px] leading-6 text-slate-500">생성 직후 수강생이 볼 수 있게 공개 상태로 만듭니다.</div>
          </div>
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
            className={`flex h-6 w-11 items-center rounded-full p-1 transition ${form.isPublished ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-pressed={form.isPublished}
          >
            <span className={`h-4 w-4 rounded-full bg-white transition ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </label>

        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-white px-4 py-4 text-[12px] leading-6 text-slate-600">
            {message}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-[12px] leading-6 text-slate-600 xl:col-span-2">
          <div className="font-semibold text-slate-900">지금 생성될 내용</div>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            <div>• 강의명: {form.title.trim() || '아직 입력되지 않음'}</div>
            <div>• 분류: {form.category.trim() || '아직 입력되지 않음'}</div>
            <div>• 난이도: {form.difficulty}</div>
            <div>• 차시: {lectureCount}개</div>
          </div>
          <div className="mt-2 text-slate-500">
            입력한 차시는 순서대로 등록되고, 기본 안내 자료와 공지가 같이 붙습니다.
          </div>
        </div>

        <div className="flex flex-wrap gap-3 xl:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? '진행 중...' : submitLabel ?? (submitMode === 'prepare' ? '다음' : '강의 만들기')}
        </button>
          <div className="rounded-full bg-slate-100 px-4 py-2.5 text-[12px] font-semibold text-slate-600">
            생성 후 기본 자료와 공지 초안이 함께 들어갑니다.
          </div>
        </div>
      </form>
    </section>
  );
}
