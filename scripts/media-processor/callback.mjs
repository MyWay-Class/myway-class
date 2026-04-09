export async function sendExtractionCallback(job, payload) {
  if (!job.callbackUrl) {
    throw new Error('callback URL이 없습니다.');
  }

  const response = await fetch(job.callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(job.callbackSecret ? { 'x-myway-media-callback-secret': job.callbackSecret } : {}),
    },
    body: JSON.stringify({
      extraction_id: job.extractionId,
      lecture_id: job.lectureId,
      processing_job_id: job.id,
      ...payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`callback 요청에 실패했습니다. (${response.status}) ${text}`.trim());
  }
}
