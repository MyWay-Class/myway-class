import { useState } from 'react';
import type { LectureTranscript } from '@myway/shared';

type TranscriptTimelineWorkspaceProps = {
  selectedLecture: { title: string; duration_minutes?: number; duration_ms?: number } | null;
  transcript: LectureTranscript | null;
};

function formatTimecode(value: number): string {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TranscriptTimelineWorkspace({ selectedLecture, transcript }: TranscriptTimelineWorkspaceProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const segments = transcript?.segments ?? [];
  const totalDurationLabel = transcript ? formatTimecode(transcript.duration_ms) : '00:00';
  const selectedLectureDurationLabel =
    transcript?.duration_ms
      ? formatTimecode(transcript.duration_ms)
      : selectedLecture?.duration_ms
        ? formatTimecode(selectedLecture.duration_ms)
        : selectedLecture?.duration_minutes
          ? `${selectedLecture.duration_minutes}분`
          : '00:00';

  async function copySegmentStart(timeMs: number) {
    const label = formatTimecode(timeMs);
    try {
      await navigator.clipboard.writeText(label);
      setCopiedLabel(label);
      window.setTimeout(() => {
        setCopiedLabel((current) => (current === label ? null : current));
      }, 1200);
    } catch {
      setCopiedLabel(null);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">타임라인 작업 공간</div>
          <div className="mt-1 text-xs text-slate-500">
            {selectedLecture
              ? `${selectedLecture.title} · ${selectedLectureDurationLabel}`
              : '강의를 선택하면 전사 타임라인이 표시됩니다.'}
          </div>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {transcript ? `${segments.length}개 세그먼트` : '전사 대기'}
        </div>
      </div>

      {transcript ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">전사 길이</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{totalDurationLabel}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">언어</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{transcript.language}</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">단어 수</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">{transcript.word_count.toLocaleString('ko-KR')}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-slate-700">
            타임스탬프는 요약, 검색, 숏폼에서 같은 기준으로 사용합니다. 아래 구간을 복사해 바로 메모나 클립 선택에 쓸 수 있습니다.
          </div>

          <div className="max-h-[560px] space-y-3 overflow-auto pr-1">
            {segments.map((segment) => (
              <article key={segment.index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void copySegmentStart(segment.start_ms);
                    }}
                    className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    {formatTimecode(segment.start_ms)} - {formatTimecode(segment.end_ms)}
                  </button>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">#{segment.index + 1}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{segment.text}</p>
              </article>
            ))}
          </div>

          {copiedLabel ? (
            <div className="rounded-full bg-emerald-100 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
              {copiedLabel} 를 복사했습니다.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          업로드와 STT가 완료되면 타임라인이 나타납니다.
        </div>
      )}
    </section>
  );
}
