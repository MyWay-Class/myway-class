import { useMemo, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import {
  QuizGenConditionPanel,
  QuizGenCoursePicker,
  QuizGenHero,
  type Difficulty,
  type QuestionType,
  difficultyLabels,
} from './QuizGenPageSections';
import { QuizGenPreviewPanel, QuizGenRecommendationPanel } from './QuizGenPagePreview';

type QuizGenPageProps = {
  courses: CourseCard[];
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
      <QuizGenHero
        selectedCourseTitle={selectedCourse?.title ?? '강의 미선택'}
        coverageSummary={coverageSummary}
        difficultyLabel={difficultyLabels[difficulty]}
        questionCount={questionCount}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <QuizGenCoursePicker courses={courses} selectedCourseId={selectedCourse?.id ?? ''} onSelectCourse={setSelectedCourseId} />

          <QuizGenConditionPanel
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            activeTypes={activeTypes}
            onToggleType={(value) => {
              setActiveTypes((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
            }}
          />
        </div>

        <div className="space-y-6">
          <QuizGenPreviewPanel
            selectedCourse={selectedCourse}
            coverageSummary={coverageSummary}
            estimatedMinutes={estimatedMinutes}
            difficultyLabel={difficultyLabels[difficulty]}
            questionCount={questionCount}
            activeTypes={activeTypes}
          />

          <QuizGenRecommendationPanel />
        </div>
      </section>
    </div>
  );
}
