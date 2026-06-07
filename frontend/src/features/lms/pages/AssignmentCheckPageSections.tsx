import type { CourseCard } from '@myway/shared';
import { AssignmentCheckPageFilters } from './AssignmentCheckPageFilters';
import { AssignmentCheckPageHeader } from './AssignmentCheckPageHeader';
import { AssignmentCheckPageList } from './AssignmentCheckPageList';

export type ReviewStatus = 'all' | 'pending' | 'reviewed' | 'flagged';

export type AssignmentItem = {
  id: string;
  course: CourseCard;
  title: string;
  status: Exclude<ReviewStatus, 'all'>;
  score: number;
  submittedAt: string;
  feedback: string;
};

export const statusMeta: Record<Exclude<ReviewStatus, 'all'>, { label: string; icon: string; tone: string }> = {
  pending: { label: '검토 대기', icon: 'ri-time-line', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  reviewed: { label: '검토 완료', icon: 'ri-check-double-line', tone: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  flagged: { label: '보완 필요', icon: 'ri-alert-line', tone: 'bg-rose-50 text-rose-600 border-rose-200' },
};

type AssignmentCheckPageSectionsProps = {
  stats: {
    total: number;
    pending: number;
    reviewed: number;
    flagged: number;
    averageScore: number;
  };
  reviewStatus: ReviewStatus;
  searchQuery: string;
  filteredAssignments: AssignmentItem[];
  onReviewStatusChange: (status: ReviewStatus) => void;
  onSearchQueryChange: (query: string) => void;
};

export function AssignmentCheckPageSections({
  stats,
  reviewStatus,
  searchQuery,
  filteredAssignments,
  onReviewStatusChange,
  onSearchQueryChange,
}: AssignmentCheckPageSectionsProps) {
  return (
    <div className="space-y-6">
      <AssignmentCheckPageHeader stats={stats} />
      <AssignmentCheckPageFilters
        reviewStatus={reviewStatus}
        searchQuery={searchQuery}
        onReviewStatusChange={onReviewStatusChange}
        onSearchQueryChange={onSearchQueryChange}
      />
      <AssignmentCheckPageList filteredAssignments={filteredAssignments} />
    </div>
  );
}
