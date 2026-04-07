import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function NoticeCardItem({ notice, formatDate }: { notice: any, formatDate: (date: string) => string }) {
  return (
    <Card isActive={notice.pinned}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <strong className="text-[0.96rem]">{notice.title}</strong>
        <span className="text-sm text-[var(--muted)]">{formatDate(notice.created_at)}</span>
      </div>
      <p className="mb-2 m-0 leading-6 text-[var(--muted)]">{notice.content}</p>
      {notice.pinned ? <Badge variant="primary">고정 공지</Badge> : <small className="text-[var(--muted)]">일반 공지</small>}
    </Card>
  );
}
