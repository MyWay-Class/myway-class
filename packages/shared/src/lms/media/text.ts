import type { MediaSummaryStyle, TranscriptSegment } from '../../types';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'into',
  '그리고', '하지만', '때문에', '여기서', '다음', '정리', '강의', '내용', '설명',
]);

export function formatTimeLabel(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function splitIntoSegments(text: string, durationMs: number): TranscriptSegment[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const segmentCount = Math.min(6, Math.max(3, Math.ceil(words.length / 10)));
  const wordsPerSegment = Math.max(1, Math.ceil(words.length / segmentCount));

  return Array.from({ length: segmentCount }, (_, index) => {
    const startWord = index * wordsPerSegment;
    const endWord = Math.min(words.length, startWord + wordsPerSegment);
    const startMs = Math.round((index / segmentCount) * durationMs);
    const endMs = index === segmentCount - 1 ? durationMs : Math.round(((index + 1) / segmentCount) * durationMs);

    return {
      index,
      start_ms: startMs,
      end_ms: Math.max(startMs + 1000, endMs),
      text: words.slice(startWord, endWord).join(' '),
    };
  }).filter((segment) => segment.text.length > 0);
}

export function extractKeyConcepts(text: string, limit: number): string[] {
  return normalizeText(text)
    .split(/[.!?]\s+|,\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, self) => self.indexOf(part) === index)
    .slice(0, limit);
}

export function extractKeywords(text: string, limit: number): string[] {
  const tokens = normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return Array.from(new Set(tokens)).slice(0, limit);
}

export function summarizeByStyle(text: string, style: MediaSummaryStyle): string {
  const sentences = normalizeText(text)
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (style === 'detailed') {
    return sentences.slice(0, 4).map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
  }

  if (style === 'timeline') {
    return sentences.slice(0, 3).map((sentence, index) => `[${formatTimeLabel(index * 60000)}] ${sentence}`).join('\n');
  }

  return sentences.slice(0, 2).join(' ');
}

export function buildTimelineMarkers(segments: TranscriptSegment[]): { time_ms: number; label: string; description: string }[] {
  return segments.slice(0, 6).map((segment) => ({
    time_ms: segment.start_ms,
    label: formatTimeLabel(segment.start_ms),
    description: segment.text.slice(0, 100),
  }));
}
