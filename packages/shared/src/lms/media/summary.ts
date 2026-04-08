import { demoLectureNotes } from '../../data/demo-data';
import type { LectureNote, MediaSummaryRequest } from '../../types';
import {
  buildTimelineMarkers,
  extractKeyConcepts,
  extractKeywords,
  findLecture,
  normalizeText,
  splitIntoSegments,
  summarizeByStyle,
  upsertPipeline,
  now,
  createId,
} from './helpers';
import { getLectureTranscript } from './transcript';

export function listLectureNotes(lectureId: string): LectureNote[] {
  return demoLectureNotes
    .filter((item) => item.lecture_id === lectureId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createLectureSummaryNote(
  userId: string,
  input: MediaSummaryRequest,
): { note: LectureNote; pipeline: ReturnType<typeof upsertPipeline>; keyConcepts: string[]; keywords: string[] } | null {
  const lecture = findLecture(input.lecture_id);
  if (!lecture) {
    return null;
  }

  const transcript = getLectureTranscript(lecture.id);
  const sourceText = transcript?.full_text ?? lecture.content_text;
  const style = input.style ?? 'brief';
  const keyConcepts = extractKeyConcepts(sourceText, style === 'detailed' ? 5 : 3);
  const keywords = extractKeywords(sourceText, 5);
  const summaryContent = summarizeByStyle(sourceText, style);
  const timestamps = style === 'timeline'
    ? buildTimelineMarkers(transcript?.segments ?? splitIntoSegments(sourceText, Math.max(lecture.duration_minutes * 60_000, 180_000)))
    : null;

  let noteType: LectureNote['note_type'] = 'ai_summary';
  let titleSuffix = '핵심 요약';
  if (style === 'detailed') {
    noteType = 'ai_detailed';
    titleSuffix = '상세 요약';
  } else if (style === 'timeline') {
    noteType = 'ai_timeline';
    titleSuffix = '타임라인 요약';
  }

  const note: LectureNote = {
    id: createId('note', demoLectureNotes.length),
    lecture_id: lecture.id,
    user_id: userId,
    note_type: noteType,
    title: `${lecture.title} - ${titleSuffix}`,
    content: summaryContent,
    key_concepts: keyConcepts,
    keywords,
    timestamps,
    language: input.language ?? 'ko',
    ai_model: 'demo-summary-v1',
    created_at: now(),
  };

  demoLectureNotes.push(note);
  const pipeline = upsertPipeline({
    lecture_id: lecture.id,
    summary_status: 'COMPLETED',
    note_id: note.id,
  });

  return { note, pipeline, keyConcepts, keywords };
}
