import type { AuthUser } from '@myway/shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AuthIdentityItemProps {
  user: AuthUser;
  isActive: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export function AuthIdentityItem({ user, isActive, disabled, onSelect }: AuthIdentityItemProps) {
  return (
    <Card
      isActive={isActive}
      onClick={disabled ? undefined : () => onSelect(user.id)}
      className={disabled ? 'opacity-50' : ''}
    >
      <div className="flex flex-col gap-3">
        <Badge variant="primary">{user.role}</Badge>
        <strong className="mt-1 text-base">{user.name}</strong>
        <p className="m-0 leading-6 text-[var(--muted)]">{user.bio}</p>
        <dl className="m-0 grid gap-2">
          <div>
            <dt className="text-[0.76rem] text-[var(--muted)]">부서</dt>
            <dd className="mt-0.5 font-bold">{user.department}</dd>
          </div>
          <div>
            <dt className="text-[0.76rem] text-[var(--muted)]">이메일</dt>
            <dd className="mt-0.5 font-bold">{user.email}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
