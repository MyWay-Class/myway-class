export type LectureWatchPanelTab = 'sessions' | 'script' | 'chat';

export const lectureWatchTabs: Array<{ key: LectureWatchPanelTab; label: string; icon: string }> = [
  { key: 'sessions', label: '차시 목록', icon: 'ri-list-check-2' },
  { key: 'script', label: '스크립트', icon: 'ri-subtitle' },
  { key: 'chat', label: '챗봇', icon: 'ri-robot-line' },
];

export function formatWatchDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0 ? `${hours}시간 ${remain}분` : `${hours}시간`;
}

export function formatWatchTimecode(value: number): string {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
