import type { AudioExtraction, CourseDetail, LectureDetail, LecturePipeline } from '@myway/shared';
import type { MediaUploadResult } from '../../../../lib/api-media';

type RetrySource = {
  video_url?: string;
  video_asset_key?: string;
  source_file_name?: string;
  source_content_type?: string;
  source_size_bytes?: number;
};

type MediaUploadWorkspaceFormSectionProps = {
  displayCourse: CourseDetail;
  lectureOptions: LectureDetail[];
  selectedLecture: LectureDetail | null;
  lectureId: string;
  audioUrl: string;
  videoFile: File | null;
  busy: boolean;
  demoMode: boolean;
  notice: string;
  formatBytes: (value: number) => string;
  onLectureChange: (lectureId: string) => void;
  onAudioUrlChange: (audioUrl: string) => void;
  onVideoFileChange: (file: File | null) => void;
  onSubmit: () => void;
};

type MediaUploadWorkspaceSummarySectionProps = {
  selectedLecture: LectureDetail | null;
  uploadResult: MediaUploadResult | null;
  latestExtraction: AudioExtraction | null;
  pipeline: LecturePipeline | null;
  retrySource: RetrySource;
};

export function MediaUploadWorkspaceFormSection({
  displayCourse,
  lectureOptions,
  selectedLecture,
  lectureId,
  audioUrl,
  videoFile,
  busy,
  demoMode,
  notice,
  formatBytes,
  onLectureChange,
  onAudioUrlChange,
  onVideoFileChange,
  onSubmit,
}: MediaUploadWorkspaceFormSectionProps) {
  return (
    <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">대상 강의</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{selectedLecture?.title ?? displayCourse.title}</div>
          <div className="mt-1 text-sm text-slate-500">
            {displayCourse.title} · {displayCourse.instructor_name}
          </div>
        </div>
        <div className="rounded-2xl bg-[#f4faff] px-4 py-3 text-right">
          <div className="text-xs text-slate-400">업로드 가능한 파일</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">3분 ~ 1시간 내외 영상</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">강의 선택</span>
          <select
            value={lectureId}
            onChange={(event) => onLectureChange(event.target.value)}
            className="w-full rounded-2xl border border-[#cce0f2] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          >
            {lectureOptions.map((lecture) => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.title}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">오디오 URL</span>
          <input
            value={audioUrl}
            onChange={(event) => onAudioUrlChange(event.target.value)}
            placeholder="이미 추출된 audio_url이 있으면 바로 입력"
            className="w-full rounded-2xl border border-[#cce0f2] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        <span className="text-sm font-semibold text-slate-700">영상 파일 업로드</span>
        <input
          type="file"
          accept="video/*"
          onChange={(event) => onVideoFileChange(event.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-2xl border border-dashed border-[#b9d7ef] bg-[#f4faff] px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {videoFile ? <div className="text-xs text-slate-500">선택됨: {videoFile.name} · {formatBytes(videoFile.size)}</div> : <div className="text-xs text-slate-500">mp4, webm, mov 등 영상 파일을 선택하세요.</div>}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || demoMode}
          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#00b8e6_0%,#0077b6_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,119,182,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-upload-2-line'}`} />
          {busy ? '진행 중' : demoMode ? '데모 모드' : '업로드 및 추출 요청'}
        </button>
        <div className="text-sm text-slate-500">{notice}</div>
      </div>
    </div>
  );
}

export function MediaUploadWorkspaceSummarySection({
  selectedLecture,
  uploadResult,
  latestExtraction,
  pipeline,
  retrySource,
}: MediaUploadWorkspaceSummarySectionProps) {
  return (
    <div className="rounded-3xl border border-[#d6e6f5] bg-white p-5 shadow-[0_14px_30px_rgba(6,31,57,0.08)]">
      <div className="text-sm font-semibold text-slate-900">현재 선택 정보</div>
      <div className="mt-3 space-y-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-[#f4faff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">강의</div>
          <div className="mt-1 font-semibold text-slate-900">{selectedLecture?.title ?? '선택된 강의 없음'}</div>
        </div>
        <div className="rounded-2xl bg-[#f4faff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">영상 업로드 결과</div>
          <div className="mt-1 break-all font-semibold text-slate-900">{uploadResult?.video_url ?? '아직 없음'}</div>
        </div>
        <div className="rounded-2xl bg-[#f4faff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">전사 결과</div>
          <div className="mt-1 font-semibold text-slate-900">{latestExtraction?.transcript_id ?? pipeline?.transcript_id ?? '아직 없음'}</div>
        </div>
        <div className="rounded-2xl bg-[#f4faff] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 서비스 job</div>
          <div className="mt-1 font-semibold text-slate-900">{latestExtraction?.processing_job_id ?? '아직 없음'}</div>
          {latestExtraction?.processing_error ? <div className="mt-2 text-xs text-rose-600">{latestExtraction.processing_error}</div> : null}
        </div>
        {retrySource.video_url ? (
          <div className="rounded-2xl bg-[#f4faff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Retry Source</div>
            <div className="mt-1 break-all text-xs text-slate-600">{retrySource.video_url}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
