import { demoMaterials, demoNotices } from '../../data/demo-data';
import type { Material, MaterialCreateRequest, Notice, NoticeCreateRequest } from '../../types';

export function getCourseMaterials(courseId: string): Material[] {
  return demoMaterials
    .filter((material) => material.course_id === courseId)
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

export function getCourseNotices(courseId: string): Notice[] {
  return demoNotices
    .filter((notice) => notice.course_id === courseId)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return b.created_at.localeCompare(a.created_at);
    });
}

export function createCourseMaterial(
  userId: string,
  courseId: string,
  input: MaterialCreateRequest,
): Material {
  const material: Material = {
    id: `mat_${String(demoMaterials.length + 1).padStart(3, '0')}`,
    course_id: courseId,
    title: input.title,
    summary: input.summary,
    file_name: input.file_name,
    uploaded_by: userId,
    uploaded_at: new Date().toISOString(),
  };

  demoMaterials.push(material);
  return material;
}

export function createCourseNotice(userId: string, courseId: string, input: NoticeCreateRequest): Notice {
  const notice: Notice = {
    id: `ntc_${String(demoNotices.length + 1).padStart(3, '0')}`,
    course_id: courseId,
    title: input.title,
    content: input.content,
    pinned: input.pinned ?? false,
    author_id: userId,
    created_at: new Date().toISOString(),
  };

  demoNotices.push(notice);
  return notice;
}
