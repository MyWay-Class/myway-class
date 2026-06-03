import { useMemo, useState } from 'react';
import type { AuthUser } from '@myway/shared';
import { demoUsers } from '../data/demo';
import { AdminUsersPageSections } from './AdminUsersPageSections';

type AdminUsersPageProps = {
  users: AuthUser[];
};

type RoleFilter = 'all' | AuthUser['role'];

export function AdminUsersPage({ users }: AdminUsersPageProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const visibleUsers = users.length > 0 ? users : demoUsers;

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return visibleUsers.filter((user) => {
      const matchesQuery = normalized
        ? [user.name, user.email, user.department, user.bio, user.role, roleLabel(user.role)].join(' ').toLowerCase().includes(normalized)
        : true;
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter, visibleUsers]);

  const counts = useMemo(
    () => ({
      total: visibleUsers.length,
      admin: visibleUsers.filter((user) => user.role === 'ADMIN').length,
      instructor: visibleUsers.filter((user) => user.role === 'INSTRUCTOR').length,
      student: visibleUsers.filter((user) => user.role === 'STUDENT').length,
    }),
    [visibleUsers],
  );

  return (
    <AdminUsersPageSections
      counts={counts}
      query={query}
      roleFilter={roleFilter}
      filteredUsers={filteredUsers}
      onQueryChange={setQuery}
      onRoleFilterChange={setRoleFilter}
    />
  );
}
