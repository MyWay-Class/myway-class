import type { CourseDetail } from '@myway/shared';
import { request } from '../api-core';

type LectureVideoMappingResult = {
  lecture_id: string;
  asset_key?: string;
  video_url?: string;
};

type EnrollmentItem = {
  id: string;
  user_id: string;
  course_id: string;
};

export async function hydrateMissingLectureVideos(detail: CourseDetail, token: string | null): Promise<CourseDetail> {
  const missingLectureIds = detail.lectures
    .filter((lecture) => !lecture.video_url && !lecture.video_asset_key)
    .map((lecture) => lecture.id);

  if (missingLectureIds.length === 0 || !token) {
    return detail;
  }

  const mappingPairs = await Promise.all(
    missingLectureIds.map(async (lectureId) => {
      const response = await request<LectureVideoMappingResult>(
        `/api/v1/media/lecture-video/${encodeURIComponent(lectureId)}`,
        undefined,
        token,
      );
      if (!response?.success || !response.data) {
        return null;
      }
      return [lectureId, response.data] as const;
    }),
  );

  const mappingMap = new Map(mappingPairs.filter(Boolean) as ReadonlyArray<readonly [string, LectureVideoMappingResult]>);
  if (mappingMap.size === 0) {
    return detail;
  }

  return {
    ...detail,
    lectures: detail.lectures.map((lecture) => {
      const mapping = mappingMap.get(lecture.id);
      if (!mapping) {
        return lecture;
      }
      return {
        ...lecture,
        video_url: lecture.video_url ?? mapping.video_url,
        video_asset_key: lecture.video_asset_key ?? mapping.asset_key,
      };
    }),
  };
}

export type { EnrollmentItem };
