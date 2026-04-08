import type { ShortformLibraryItem, ShortformVideoDetail } from '../../types';
import { demoShortformSaves, demoShortformVideos, buildVideoDetail, getVideo } from './data';

export function listMyShortformVideos(userId: string): ShortformLibraryItem[] {
  return demoShortformVideos
    .filter((video) => video.user_id === userId)
    .map((video) => ({
      ...buildVideoDetail(video),
      ownership: 'owned' as const,
    }));
}

export function listMyShortformLibrary(userId: string): ShortformLibraryItem[] {
  return [
    ...listMyShortformVideos(userId),
    ...demoShortformSaves
      .filter((save) => save.user_id === userId)
      .map((save) => {
        const video = getVideo(save.video_id)!;
        return {
          ...buildVideoDetail(video),
          ownership: 'saved' as const,
          save_note: save.note,
          save_folder: save.folder,
          saved_at: save.created_at,
        };
      }),
  ];
}

export function getShortformVideoDetail(videoId: string): ShortformVideoDetail | undefined {
  const video = getVideo(videoId);
  if (!video) {
    return undefined;
  }

  return buildVideoDetail(video);
}
