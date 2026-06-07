import { useState, type FormEvent } from 'react';
import type { CourseCreateRequest, CourseDetail } from '@myway/shared';
import {
  CourseCreateCardFormSection,
  CourseCreateCardLockedState,
  CourseCreateCardSummarySection,
} from './CourseCreateCardSections';

export type CourseCreateCardProps = {
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
    return <CourseCreateCardLockedState />;
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
      <CourseCreateCardFormSection
        busy={busy}
        message={message}
        form={form}
        lectureCount={lectureCount}
        submitLabel={submitLabel}
        submitMode={submitMode}
        onSubmit={(event) => void handleSubmit(event)}
        onChangeTitle={(title) => setForm((current) => ({ ...current, title }))}
        onChangeDescription={(description) => setForm((current) => ({ ...current, description }))}
        onChangeCategory={(category) => setForm((current) => ({ ...current, category }))}
        onChangeDifficulty={(difficulty) => setForm((current) => ({ ...current, difficulty }))}
        onChangeLectureTitlesText={(lectureTitlesText) => setForm((current) => ({ ...current, lectureTitlesText }))}
        onTogglePublished={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
      />
      <CourseCreateCardSummarySection form={form} lectureCount={lectureCount} />
    </section>
  );
}
