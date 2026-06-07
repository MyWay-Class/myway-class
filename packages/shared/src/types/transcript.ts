export type TranscriptChunk = {
  lecture_id?: string;
  transcript_id?: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
  confidence?: number;
  speaker?: string | null;
  topic_tags?: string[];
  index: number;
  chunk_index?: number;
};

export type TranscriptChunkInput = {
  lecture_id?: string;
  transcript_id?: string | null;
  start_ms: number;
  end_ms: number;
  text: string;
  confidence?: number;
  speaker?: string | null;
  topic_tags?: string[];
  index: number;
  chunk_index?: number;
};

export type TimelineProjectClip = {
  lecture_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  confidence?: number;
  speaker?: string | null;
  topic_tags?: string[];
  order_index: number;
  note?: string | null;
};

export type TimelineProjectStatus = 'draft' | 'selected' | 'rendering' | 'exported';

export type TimelineProject = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  status: TimelineProjectStatus;
  clips: TimelineProjectClip[];
  created_at: string;
  updated_at: string;
};

export type AnswerPolicy = {
  min_confidence: number;
  clarify_threshold: number;
  handoff_threshold: number;
  max_clarify_rounds: number;
  citation_required: boolean;
};

export function normalizeTranscriptChunk(
  input: TranscriptChunkInput,
  lectureId: string,
  chunkIndex: number,
  transcriptId?: string | null,
): TranscriptChunk {
  return {
    lecture_id: input.lecture_id ?? lectureId,
    transcript_id: input.transcript_id ?? transcriptId ?? null,
    start_ms: Math.max(0, Math.round(input.start_ms)),
    end_ms: Math.max(Math.round(input.start_ms), Math.round(input.end_ms)),
    text: String(input.text ?? '').trim(),
    confidence: input.confidence ?? 0.92,
    speaker: input.speaker ?? null,
    topic_tags: Array.isArray(input.topic_tags) ? input.topic_tags.filter(Boolean).map((value) => String(value)) : [],
    index: input.index ?? input.chunk_index ?? chunkIndex,
    chunk_index: input.chunk_index ?? input.index ?? chunkIndex,
  };
}

export function buildTranscriptChunks(
  lectureId: string,
  chunks: TranscriptChunkInput[],
  transcriptId?: string | null,
): TranscriptChunk[] {
  return chunks.map((chunk, index) => normalizeTranscriptChunk(chunk, lectureId, index, transcriptId));
}
