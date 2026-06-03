import { canEnroll, getRoleLabel } from '@myway/shared';
import { getStoredAuth } from '../api-core';

export function canCurrentUserEnroll(): boolean {
  const storedAuth = getStoredAuth();
  return storedAuth ? canEnroll(storedAuth.user.role) : false;
}

export function getCurrentRoleLabel(): string {
  const storedAuth = getStoredAuth();
  return storedAuth ? getRoleLabel(storedAuth.user.role) : '게스트';
}
