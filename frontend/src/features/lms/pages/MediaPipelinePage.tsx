import { useEffect, useMemo, useState } from 'react';
import type { CourseDetail, LectureDetail } from '@myway/shared';
import { StatePanel } from '../components/StatePanel';
import { MediaPipelineStatusBoard } from '../components/MediaPipelineStatusBoard';
import { createAudioExtraction, loadMediaPipeline, loadMediaProviders, uploadLectureVideo, type MediaExtractionResult, type MediaUploadResult } from '../../../lib/api-media';
import type { STTProviderCatalog, LecturePipeline } from '@myway/shared';

type MediaPipelinePageProps = {
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  sessionToken: string;
};

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPipelinePage({ selectedCourse, highlightedLecture, sessionToken }: MediaPipelinePageProps) {
  const lectureOptions = selectedCourse?.lectures ?? [];
  const defaultLectureId = highlightedLecture?.id ?? lectureOptions[0]?.id ?? '';
  const [lectureId, setLectureId] = useState(defaultLectureId);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('영상 파일을 업로드하면 R2 업로드 후 외부 오디오 추출 서비스와 STT 파이프라인이 순서대로 연결됩니다.');
  const [pipeline, setPipeline] = useState<LecturePipeline | null>(null);
  const [providers, setProviders] = useState<STTProviderCatalog | null>(null);
  const [uploadResult, setUploadResult] = useState<MediaUploadResult | null>(null);
  const [extractionResult, setExtractionResult] = useState<MediaExtractionResult | null>(null);

  useEffect(() => {
    setLectureId(defaultLectureId);
  }, [defaultLectureId]);

  useEffect(() => {
    if (!lectureId) {
      setPipeline(null);
      return;
    }

    let active = true;
    loadMediaPipeline(lectureId, sessionToken).then((result) => {
      if (active) {
        setPipeline(result);
      }
    });
    loadMediaProviders(sessionToken).then((result) => {
      if (active) {
        setProviders(result);
      }
    });

    return () => {
      active = false;
    };
  }, [lectureId, sessionToken]);

  const selectedLecture = useMemo(
    () => lectureOptions.find((lecture) => lecture.id === lectureId) ?? highlightedLecture ?? null,
    [highlightedLecture, lectureId, lectureOptions],
  );

  async function handleSubmit() {
    if (!lectureId) {
      setNotice('먼저 강의를 선택해 주세요.');
      return;
    }

    if (!videoFile) {
      setNotice('업로드할 영상 파일을 선택해 주세요.');
      return;
    }

    setBusy(true);
      setNotice('영상 업로드와 외부 오디오 추출 job을 생성하는 중입니다.');

    try {
      const upload = await uploadLectureVideo(lectureId, videoFile, sessionToken);
      if (!upload) {
        setNotice('영상 업로드에 실패했습니다. R2 binding과 권한을 확인해 주세요.');
        return;
      }

      setUploadResult(upload);
      const extraction = await createAudioExtraction(
        {
          lecture_id: lectureId,
          video_url: upload.video_url,
          video_asset_key: upload.asset_key,
          source_file_name: upload.file_name,
          source_content_type: upload.content_type,
          source_size_bytes: upload.size_bytes,
          audio_url: audioUrl.trim() || undefined,
          language: 'ko',
        },
        sessionToken,
      );

      if (!extraction) {
        setNotice('오디오 추출 job 생성에 실패했습니다.');
        return;
      }

      setExtractionResult(extraction);
      const latestPipeline = await loadMediaPipeline(lectureId, sessionToken);
      setPipeline(latestPipeline);
      setNotice(
        extraction.transcript_id
          ? '업로드, 추출, 전사까지 완료되었습니다.'
          : '업로드와 추출 job이 등록되었습니다. 외부 처리 서비스 callback 이후 전사가 자동으로 이어집니다.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-sm">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
          Cloudflare R2 · Workers AI · media pipeline
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">강의 영상 업로드와 오디오 추출 파이프라인</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/75">
          강의 영상을 R2에 업로드하고, 오디오 추출 job과 STT 전사를 같은 화면에서 이어서 확인할 수 있습니다.
        </p>
      </section>

      {!selectedCourse ? (
        <StatePanel
          compact
          icon="ri-movie-2-line"
          tone="slate"
          title="먼저 강의를 선택해 주세요."
          description="이 화면은 현재 선택된 강의의 미디어 업로드와 전사를 연결합니다. 강의 목록에서 대상 강의를 선택한 뒤 다시 열면 됩니다."
        />
      ) : (
        <>
          <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">대상 강의</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">{selectedLecture?.title ?? selectedCourse.title}</div>
                  <div className="mt-1 text-sm text-slate-500">{selectedCourse.title} · {selectedCourse.instructor_name}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <div className="text-xs text-slate-400">업로드 가능한 파일</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">3분 ~ 1시간 내외 영상</div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">강의 선택</span>
                  <select
                    value={lectureId}
                    onChange={(event) => setLectureId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
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
                    onChange={(event) => setAudioUrl(event.target.value)}
                    placeholder="이미 추출된 audio_url이 있으면 바로 입력"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2">
                <span className="text-sm font-semibold text-slate-700">영상 파일 업로드</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {videoFile ? (
                  <div className="text-xs text-slate-500">
                    선택됨: {videoFile.name} · {formatBytes(videoFile.size)}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">mp4, webm, mov 등 영상 파일을 선택하세요.</div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <i className={`${busy ? 'ri-loader-4-line animate-spin' : 'ri-upload-2-line'}`} />
                  {busy ? '진행 중' : '업로드 및 추출 요청'}
                </button>
                <div className="text-sm text-slate-500">{notice}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">현재 선택 정보</div>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">강의</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedLecture?.title ?? '선택된 강의 없음'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">영상 업로드 결과</div>
                  <div className="mt-1 break-all font-semibold text-slate-900">{uploadResult?.video_url ?? '아직 없음'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">전사 결과</div>
                  <div className="mt-1 font-semibold text-slate-900">{extractionResult?.transcript_id ?? '아직 없음'}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">처리 서비스 job</div>
                  <div className="mt-1 font-semibold text-slate-900">{extractionResult?.processing_job_id ?? '아직 없음'}</div>
                  {extractionResult?.processing_error ? (
                    <div className="mt-2 text-xs text-rose-600">{extractionResult.processing_error}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <MediaPipelineStatusBoard
            selectedLecture={selectedLecture}
            pipeline={pipeline}
            providers={providers}
            uploadResult={uploadResult}
            extractionResult={extractionResult}
          />
        </>
      )}
    </div>
  );
}
