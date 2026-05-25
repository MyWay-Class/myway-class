import { getStoredAuth, request } from './api-core';

export type AdminAssignmentRecord = {
  course_id: string;
  student_ids: string[];
  updated_by?: string;
  updated_at?: string;
};

export async function loadAdminAssignment(courseId: string): Promise<AdminAssignmentRecord | null> {
  const token = getStoredAuth()?.session_token ?? null;
  if (!token) return null;
  const response = await request<AdminAssignmentRecord>(`/api/v1/admin/assignments/${courseId}`, {
    method: 'GET',
  }, token);
  return response?.success && response.data ? response.data : null;
}

export async function saveAdminAssignment(courseId: string, studentIds: string[]): Promise<AdminAssignmentRecord | null> {
  const token = getStoredAuth()?.session_token ?? null;
  if (!token) return null;
  const response = await request<AdminAssignmentRecord>(`/api/v1/admin/assignments/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      student_ids: studentIds,
    }),
  }, token);
  return response?.success && response.data ? response.data : null;
}
