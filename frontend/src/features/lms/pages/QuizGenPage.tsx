import { useMemo, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';

type QuizGenPageProps = {
  courses: CourseCard[];
};

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type QuestionType = '객관식' | '단답형' | '서술형' | '빈칸';

const questionTypes: QuestionType[] = ['객관식', '단답형', '서술형', '빈칸'];

const difficultyLabels: Record<Difficulty, string> = {
  beginner: '입문',
  intermediate: '중급',
  advanced: '고급',
};

export function QuizGenPage({ courses }: QuizGenPageProps) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? '');
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(8);
  const [activeTypes, setActiveTypes] = useState<QuestionType[]>(['객관식', '단답형']);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === selectedCourseId) ?? courses[0] ?? null, [courses, selectedCourseId]);

  const coverageSummary = useMemo(() => {
    if (!selectedCourse) {
      return '강의를 선택하면 추천 유형과 난이도 요약이 표시됩니다.';
    }

    return `${selectedCourse.lecture_count}차시 중 핵심 차시를 우선 반영하고, ${difficultyLabels[difficulty]} 난이도로 ${questionCount}문항을 구성합니다.`;
  }, [difficulty, questionCount, selectedCourse]);

  const estimatedMinutes = Math.max(Math.round(questionCount * (difficulty === 'beginner' ? 1.5 : difficulty === 'intermediate' ? 2 : 2.5)), 5);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#312e81_100%)] px-6 py-6 text-white shadow-sm lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur">
              <i className="ri-question-line" />
              시험·퀴즈 자동 생성
            </div>
            <h2 className="mt-4 text-[26px] font-extrabold tracking-[-0.04em] lg:text-[32px]">
              강의 선택부터 문항 수와
              <br />
              난이도까지 한 흐름으로 조정합니다.
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-white/78">
              레퍼런스처럼 입력과 요약을 분리해, 강의 선택 다음에 바로 문제 생성 조건이 보이도록 정리했습니다.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 px-5 py-5 text-white/85 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">설정 요약</div>
            <div className="mt-3 text-[18px] font-extrabold text-white">{selectedCourse?.title ?? '강의 미선택'}</div>
            <div className="mt-2 text-[12px] leading-6 text-white/70">{coverageSummary}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
              <div className="rounded-2xl bg-white/10 px-3 py-3">
                <div className="text-white/60">난이도</div>
                <div className="mt-1 text-[16px] font-bold text-white">{difficultyLabels[difficulty]}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-3">
                <div className="text-white/60">문항</div>
                <div className="mt-1 text-[16px] font-bold text-white">{questionCount}개</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-book-open-line text-indigo-600" />
              강의 선택
            </h3>
            <div className="mt-4 space-y-2">
              {courses.map((course) => {
                const active = selectedCourse?.id === course.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`flex w-full items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                      active ? 'border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-[20px] text-indigo-600">
                      <i className="ri-play-circle-line" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-slate-900">{course.title}</div>
                      <div className="mt-1 text-[12px] text-slate-500">
                        {course.category} · {course.instructor_name} · {course.lecture_count}차시
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600">{course.progress_percent}%</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-settings-3-line text-indigo-600" />
              생성 조건
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[12px] text-slate-500">
                  <span>문항 수</span>
                  <span>{questionCount}개</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={1}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="mb-2 text-[12px] text-slate-500">난이도</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((item) => {
                    const active = difficulty === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setDifficulty(item)}
                        className={`rounded-2xl px-3 py-3 text-[12px] font-semibold transition ${
                          active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {difficultyLabels[item]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[12px] text-slate-500">문항 유형</div>
                <div className="flex flex-wrap gap-2">
                  {questionTypes.map((type) => {
                    const active = activeTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setActiveTypes((current) =>
                            current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
                          )
                        }
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                          active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">생성 미리보기</h3>
                <p className="mt-1 text-[12px] text-slate-500">선택한 강의와 조건을 반영한 결과 구조를 먼저 보여줍니다.</p>
              </div>
              <div className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">{estimatedMinutes}분 예상</div>
            </div>

            {selectedCourse ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[26px] bg-[linear-gradient(135deg,#eff6ff_0%,#eef2ff_50%,#f5f3ff_100%)] px-5 py-5">
                  <div className="text-[12px] font-semibold text-indigo-600">선택 강의</div>
                  <div className="mt-1 text-[20px] font-extrabold tracking-[-0.03em] text-slate-900">{selectedCourse.title}</div>
                  <div className="mt-2 text-[13px] leading-6 text-slate-600">
                    {selectedCourse.category} · {selectedCourse.lecture_count}차시 · {selectedCourse.total_duration_minutes}분
                  </div>
                  <p className="mt-4 text-[13px] leading-7 text-slate-600">{coverageSummary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500">
                      퀴즈 생성
                    </button>
                    <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600">
                      저장하기
                    </button>
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <div className="text-[12px] font-semibold text-slate-400">설정 상태</div>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[11px] text-slate-400">난이도</div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">{difficultyLabels[difficulty]}</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[11px] text-slate-400">문항 수</div>
                      <div className="mt-1 text-[13px] font-semibold text-slate-900">{questionCount}개</div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <div className="text-[11px] text-slate-400">유형</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {activeTypes.length ? (
                          activeTypes.map((type) => (
                            <span key={type} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] text-slate-500">유형을 하나 이상 선택하세요.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <StatePanel
                  compact
                  icon="ri-question-line"
                  tone="slate"
                  title="강의를 먼저 선택하세요."
                  description="강의를 고르면 문항 수, 난이도, 유형을 기준으로 생성 미리보기가 나타납니다."
                />
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
              <i className="ri-list-check-2 text-indigo-600" />
              추천 구성
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                { label: '핵심 개념 확인', value: '객관식 5문항' },
                { label: '이해도 점검', value: '단답형 2문항' },
                { label: '서술형 복습', value: '서술형 1문항' },
                { label: '보조 복습', value: '빈칸 2문항' },
              ].map((item) => (
                <article key={item.label} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[11px] font-semibold text-slate-400">{item.label}</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-900">{item.value}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
