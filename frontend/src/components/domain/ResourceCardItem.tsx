import { Card } from '../ui/Card';

export function ResourceCardItem({ material, formatDate }: { material: any, formatDate: (date: string) => string }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between gap-3">
        <strong className="text-[0.96rem]">{material.title}</strong>
        <span className="text-sm text-[var(--muted)]">{formatDate(material.uploaded_at)}</span>
      </div>
      <p className="mb-2 m-0 leading-6 text-[var(--muted)]">{material.summary}</p>
      <small className="text-[var(--muted)]">{material.file_name}</small>
    </Card>
  );
}
