import type { UserRole } from './types';

export const roleLabels: Record<UserRole, string> = {
  STUDENT: '수강생',
  INSTRUCTOR: '강사',
  ADMIN: '운영자',
};

export const rolePermissions: Record<UserRole, string[]> = {
  STUDENT: ['COURSE_VIEW', 'LECTURE_VIEW', 'ENROLL', 'PROGRESS_READ'],
  INSTRUCTOR: ['COURSE_VIEW', 'LECTURE_VIEW', 'COURSE_MANAGE', 'LECTURE_MANAGE', 'PROGRESS_READ'],
  ADMIN: ['COURSE_VIEW', 'LECTURE_VIEW', 'COURSE_MANAGE', 'LECTURE_MANAGE', 'ENROLL_MANAGE', 'PROGRESS_READ', 'USER_MANAGE'],
};

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function getPermissions(role: UserRole): string[] {
  return rolePermissions[role];
}

export function canEnroll(role: UserRole): boolean {
  return role === 'STUDENT' || role === 'ADMIN';
}

export function canManageCourses(role: UserRole): boolean {
  return role === 'INSTRUCTOR' || role === 'ADMIN';
}
