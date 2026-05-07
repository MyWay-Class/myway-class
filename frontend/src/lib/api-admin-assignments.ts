import { request, unwrap } from './api-core';

export type AdminAssignmentRecord = {
  course_id: string;
  student_ids: string[];
  updated_by?: string;
  updated_at?: string;
};

function fallbackRecord(courseId: string): AdminAssignmentRecord {
  return {
    course_id: courseId,
    student_ids: [],
  };
}

export async function loadAdminAssignment(courseId: string): Promise<AdminAssignmentRecord> {
  const response = await request<AdminAssignmentRecord>(`/api/v1/admin/assignments/${courseId}`, {
    method: 'GET',
  });
  return unwrap(response, () => fallbackRecord(courseId));
}

export async function saveAdminAssignment(courseId: string, studentIds: string[]): Promise<AdminAssignmentRecord> {
  const response = await request<AdminAssignmentRecord>(`/api/v1/admin/assignments/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      student_ids: studentIds,
    }),
  });
  return unwrap(response, () => fallbackRecord(courseId));
}
