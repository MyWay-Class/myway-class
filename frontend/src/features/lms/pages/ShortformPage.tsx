import { useEffect, useMemo, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail, ShortformCommunityItem } from '@myway/shared';
import { composeCustomCourseDraft, loadShortformCommunity, shareCustomCourseDraft } from '../../../lib/api';

type ShortformPageProps = {
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
};

function toClipWindow(durationMinutes: number, index: number): { start_time_ms: number; end_time_ms: number } {
  const total = Math.max(durationMinutes, 1) * 60_000;
  const segment = Math.max(Math.round(total / 4), 30_000);
  const start_time_ms = Math.min(index * segment, Math.max(total - segment, 0));
  const end_time_ms = Math.min(start_time_ms + segment, total);
  return { start_time_ms, end_time_ms };
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function buildPreviewClips(selectedCourse: CourseDetail | null, highlightedLecture: LectureDetail | null) {
  const lectures = selectedCourse?.lectures.slice(0, 3) ?? (highlightedLecture ? [highlightedLecture] : []);

  return lectures.map((lecture, index) => {
    const window = toClipWindow(lecture.duration_minutes, index);
    return {
      lecture_id: lecture.id,
      lecture_title: lecture.title,
      start_time_ms: window.start_time_ms,
      end_time_ms: window.end_time_ms,
      label: `${lecture.title} 요약 ${index + 1}`,
      description: lecture.content_text.slice(0, 72),
    };
  });
}

export function ShortformPage({ highlightedLecture, selectedCourse, courses, sessionToken }: ShortformPageProps) {
  const [communityItems, setCommunityItems] = useState<ShortformCommunityItem[]>([]);
  const [composeMessage, setComposeMessage] = useState('핵심 구간을 이어 붙여 학습용 개인 코스로 정리합니다.');
  const [status, setStatus] = useState('아직 조립된 개인 코스가 없습니다.');
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    loadShortformCommunity(selectedCourse?.id ?? null, sessionToken).then((items) => {
      if (alive) {
        setCommunityItems(items.slice(0, 4));
      }
    });

    return () => {
      alive = false;
    };
  }, [selectedCourse?.id, sessionToken]);

  const previewClips = useMemo(() => buildPreviewClips(selectedCourse, highlightedLecture), [selectedCourse, highlightedLecture]);
  const composerCourse = selectedCourse
    ?? (courses[0]
      ? ({ ...courses[0], lectures: [], materials: [], notices: [] } as CourseDetail)
      : null);

  async function handleCreateCourse() {
    if (!composerCourse || previewClips.length === 0) {
      setStatus('조립할 강의와 클립이 필요합니다.');
      return;
    }

    const result = await composeCustomCourseDraft(
      {
        course_id: composerCourse.id,
        title: `${composerCourse.title} 개인 코스`,
        description: composeMessage,
        clips: previewClips.map((clip) => ({
          lecture_id: clip.lecture_id,
          start_time_ms: clip.start_time_ms,
          end_time_ms: clip.end_time_ms,
          label: clip.label,
          description: clip.description,
        })),
      },
      sessionToken,
    );

    if (!result) {
      setStatus('개인 코스를 조립하지 못했습니다.');
      return;
    }

    setCreatedCourseId(result.id);
    setStatus(`개인 코스 ${result.title}를 만들었습니다. 공유하거나 복사할 수 있습니다.`);
    const refreshed = await loadShortformCommunity(composerCourse.id, sessionToken);
    setCommunityItems(refreshed.slice(0, 4));
  }

  async function handleShareCourse() {
    if (!createdCourseId) {
      setStatus('먼저 개인 코스를 만들어야 공유할 수 있습니다.');
      return;
    }

    const shared = await shareCustomCourseDraft(createdCourseId, { message: '개인 코스를 코스 참여자와 공유합니다.' }, sessionToken);
    setStatus(shared ? '개인 코스를 공유했습니다.' : '공유에 실패했습니다.');
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-5">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">개인 코스 컴포저</h2>
              <p className="mt-1 text-[12px] text-slate-500">
                강의 클립을 조합해서 나만의 코스를 만들고, 만든 코스를 공유하거나 복사할 수 있습니다.
              </p>
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600">
              {composerCourse ? composerCourse.title : '선택된 강의 없음'}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {previewClips.length > 0 ? (
              previewClips.map((clip, index) => (
                <div key={`${clip.lecture_id}-${clip.start_time_ms}`} className="flex gap-3 rounded-2xl border border-slate-200 px-4 py-4 hover:bg-slate-50">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 text-[10px] font-semibold text-slate-500">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] text-slate-500">{clip.lecture_title}</div>
                    <div className="mt-1 text-[13px] font-medium text-slate-900">{clip.label}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
                      <span>{formatDuration(clip.start_time_ms)} - {formatDuration(clip.end_time_ms)}</span>
                      <span>개인 코스 클립</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-[13px] leading-6 text-slate-500">
                선택한 강의가 없어서 조립 미리보기를 만들 수 없습니다.
              </p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <label className="text-[12px] font-semibold text-slate-500">조립 메모</label>
            <textarea
              value={composeMessage}
              onChange={(event) => setComposeMessage(event.target.value)}
              className="mt-2 h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 text-slate-700 outline-none"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleCreateCourse()} className="rounded-full bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white">
                개인 코스 만들기
              </button>
              <button type="button" onClick={() => void handleShareCourse()} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600">
                공유하기
              </button>
            </div>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">{status}</p>
            {createdCourseId ? <p className="mt-1 text-[11px] text-slate-400">생성 ID: {createdCourseId}</p> : null}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">커뮤니티 미리보기</h3>
          <p className="mt-1 text-[12px] text-slate-500">현재 강의 문맥과 연결된 공유 숏폼을 바로 확인할 수 있습니다.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {communityItems.length > 0 ? (
              communityItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-[12px] font-semibold text-indigo-600">{item.shared_by_name}</div>
                  <div className="mt-1 text-[14px] font-bold text-slate-900">{item.title}</div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-6 text-slate-500">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.course_title}</span>
                    <span>{item.total_segments}개 클립</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-[13px] leading-6 text-slate-500">공유된 숏폼이 아직 없습니다.</p>
            )}
          </div>
        </article>
      </section>

      <aside className="space-y-5">
        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">조립 기준</h3>
          <div className="mt-4 space-y-3 text-[13px] leading-6 text-slate-500">
            <p>선택된 강의와 현재 수강 중인 코스를 기준으로 첫 3개 클립을 제안합니다.</p>
            <p>개인 코스는 생성 후 공유하거나 복사해 다른 흐름으로 다시 묶을 수 있습니다.</p>
            <p>기존 숏폼 커뮤니티는 같은 레이아웃 안에서 바로 미리보기로 확인할 수 있습니다.</p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
          <h3 className="text-[15px] font-bold text-slate-900">선택 정보</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-[12px] text-slate-500">선택한 코스</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">{composerCourse?.title ?? '없음'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="text-[12px] text-slate-500">선택한 강의</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">{highlightedLecture?.title ?? '없음'}</div>
            </div>
          </div>
        </article>
      </aside>
    </div>
  );
}
