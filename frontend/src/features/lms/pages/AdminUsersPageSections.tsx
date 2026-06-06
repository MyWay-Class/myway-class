import type { AuthUser } from '@myway/shared';
import { AdminUsersPageDesktopTable } from './AdminUsersPageDesktopTable';
import { AdminUsersPageFilters } from './AdminUsersPageFilters';
import { AdminUsersPageHeader } from './AdminUsersPageHeader';
import { AdminUsersPageMobileCards } from './AdminUsersPageMobileCards';

type AdminUsersPageSectionsProps = {
  counts: {
    total: number;
    admin: number;
    instructor: number;
    student: number;
  };
  query: string;
  roleFilter: 'all' | AuthUser['role'];
  filteredUsers: AuthUser[];
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (filter: 'all' | AuthUser['role']) => void;
};

export function AdminUsersPageSections({
  counts,
  query,
  roleFilter,
  filteredUsers,
  onQueryChange,
  onRoleFilterChange,
}: AdminUsersPageSectionsProps) {
  return (
    <div className="space-y-6">
      <AdminUsersPageHeader counts={counts} />
      <AdminUsersPageFilters
        query={query}
        roleFilter={roleFilter}
        totalCount={counts.total}
        filteredUsersLength={filteredUsers.length}
        onQueryChange={onQueryChange}
        onRoleFilterChange={onRoleFilterChange}
      />
      <section className="rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <AdminUsersPageDesktopTable filteredUsers={filteredUsers} />
        <AdminUsersPageMobileCards filteredUsers={filteredUsers} />
      </section>
    </div>
  );
}
