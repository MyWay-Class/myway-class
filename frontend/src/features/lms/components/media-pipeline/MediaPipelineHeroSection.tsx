export function MediaPipelineHeroSection() {
  return (
    <section className="rounded-3xl border border-cyan-100 bg-[linear-gradient(135deg,#03162a_0%,#005d93_48%,#0bc5ea_100%)] px-6 py-6 text-white shadow-[0_22px_50px_rgba(4,49,84,0.24)]">
      <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
        Cloudflare R2 · Workers AI · media pipeline
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.04em]">실제 강의 업로드와 오디오 추출 파이프라인</h1>
      <p className="mt-2 max-w-3xl text-sm text-white/75">
        강의 영상을 R2에 업로드하고, 오디오 추출 job과 STT 전사를 같은 화면에서 이어서 확인할 수 있습니다.
      </p>
    </section>
  );
}
