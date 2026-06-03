import { useMemo, useState } from 'react';
import type { CourseCard } from '@myway/shared';
import { AssignmentCheckPageSections, type AssignmentItem, type ReviewStatus } from './AssignmentCheckPageSections';

type AssignmentCheckPageProps = {
  courses: CourseCard[];
};

function buildAssignments(courses: CourseCard[]): AssignmentItem[] {
  return courses.slice(0, 6).map((course, index) => {
    const status: AssignmentItem['status'] = index % 3 === 0 ? 'pending' : index % 3 === 1 ? 'reviewed' : 'flagged';
    return {
      id: `${course.id}-${index}`,
      course,
      title: `${course.title} 과제 ${index + 1}`,
      status,
      score: Math.min(95, Math.max(60, Math.round(course.progress_percent + 55 - index * 3))),
      submittedAt: `${index + 1}시간 전`,
      feedback:
        status === 'pending'
          ? '제출물을 열어 요약과 기준 충족 여부를 확인합니다.'
          : status === 'reviewed'
            ? '기본 항목이 충족되었습니다. 간단한 피드백만 남기면 됩니다.'
            : '참조 자료와 형식 정리가 조금 더 필요합니다.',
    };
  });
}

export function AssignmentCheckPage({ courses }: AssignmentCheckPageProps) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const assignments = useMemo(() => buildAssignments(courses), [courses]);
  const filteredAssignments = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesSearch = normalized
        ? [item.title, item.course.title, item.course.instructor_name, item.course.category, item.feedback].join(' ').toLowerCase().includes(normalized)
        : true;
      const matchesStatus = reviewStatus === 'all' ? true : item.status === reviewStatus;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, reviewStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: assignments.length,
      pending: assignments.filter((item) => item.status === 'pending').length,
      reviewed: assignments.filter((item) => item.status === 'reviewed').length,
      flagged: assignments.filter((item) => item.status === 'flagged').length,
      averageScore:
        assignments.length > 0 ? Math.round(assignments.reduce((sum, item) => sum + item.score, 0) / assignments.length) : 0,
    }),
    [assignments],
  );

  return (
    <AssignmentCheckPageSections
      stats={stats}
      reviewStatus={reviewStatus}
      searchQuery={searchQuery}
      filteredAssignments={filteredAssignments}
      onReviewStatusChange={setReviewStatus}
      onSearchQueryChange={setSearchQuery}
    />
  );
}
