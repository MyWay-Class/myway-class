type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string } | null;
  message?: string;
};

type BatchStatusData = {
  success_count?: number;
};

type SessionData = {
  user?: { id?: string; role?: string };
  session_token?: string;
};

type EnrollmentData = {
  id?: string;
  course_id?: string;
  user_id?: string;
};

type EnrollmentCreateResponse = {
  enrollmentId?: string;
  course?: CourseDetailData;
};

type CourseLecture = {
  id?: string;
  course_id?: string;
};

type CourseDetailData = {
  id?: string;
  lectures?: CourseLecture[];
};

type LectureData = {
  id?: string;
  course_id?: string;
};

type LectureVideoData = {
  lecture_id?: string;
  asset_key?: string;
  video_url?: string;
};

type TranscriptData = {
  lecture_id?: string;
  segments?: Array<{ start_ms?: number; end_ms?: number; text?: string }>;
};

type ShortformData = {
  id?: string;
  export_status?: string;
  clips?: Array<{ lecture_id?: string; start_ms?: number; end_ms?: number }>;
  export_job_payload?: {
    clips?: Array<{ lecture_id?: string; start_time_ms?: number; end_time_ms?: number }>;
  };
};

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const callbackToken = process.env.SMOKE_SHORTFORM_CALLBACK_TOKEN || "local-media-callback-secret";
const studentUserId = process.env.SMOKE_STUDENT_USER_ID || "usr_std_001";
const adminUserId = process.env.SMOKE_ADMIN_USER_ID || "usr_admin_001";
const smokeLectureId = process.env.SMOKE_LECTURE_ID || "lec_java_01";
const smokeCourseId = process.env.SMOKE_COURSE_ID || "crs_java_01";
const requirePlayback = (process.env.SMOKE_REQUIRE_PLAYBACK || "").toLowerCase() === "true";

function assertOk(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function playbackDebugSummary(res: Response): string {
  const errorCode = res.headers.get("x-error-code") || "";
  const errorMessage = res.headers.get("x-error-message") || "";
  const contentType = res.headers.get("content-type") || "";
  const contentRange = res.headers.get("content-range") || "";
  return `status=${res.status}, content-type=${contentType}, content-range=${contentRange}, x-error-code=${errorCode}, x-error-message=${errorMessage}`;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<{ res: Response; body: ApiEnvelope<T> | null }> {
  const res = await fetch(`${baseUrl}${path}`, options);
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }
  return { res, body };
}

async function authedApi<T>(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<{ res: Response; body: ApiEnvelope<T> | null }> {
  const headers = { ...(options.headers ?? {}), ...authHeader(token) };
  return api<T>(path, { ...options, headers });
}

async function login(userId: string): Promise<string> {
  const { res, body } = await api<{ session_token?: string }>("/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  assertOk(res.ok, `login failed: ${userId} (${res.status})`);
  const token = body?.data?.session_token;
  assertOk(typeof token === "string" && token.length > 0, `missing session token: ${userId}`);
  return token;
}

function authHeader(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

async function run(): Promise<void> {
  console.log(`[smoke] baseUrl=${baseUrl}`);
  console.log(`[smoke] requirePlayback=${requirePlayback}`);

  const health = await api<unknown>("/api/v1/health");
  assertOk(health.res.ok, `health check failed (${health.res.status})`);

  const studentToken = await login(studentUserId);
  const adminToken = await login(adminUserId);

  const me = await authedApi<SessionData>(studentToken, "/api/v1/auth/me", { method: "GET" });
  assertOk(me.res.ok, `auth me failed (${me.res.status})`);
  assertOk(me.body?.data?.user?.id === studentUserId, "auth me user mismatch");

  const enrollments = await authedApi<EnrollmentData[]>(studentToken, "/api/v1/enrollments", { method: "GET" });
  assertOk(enrollments.res.ok, `enrollments failed (${enrollments.res.status})`);
  assertOk(Array.isArray(enrollments.body?.data), "enrollments missing");

  const isEnrolled = (enrollments.body?.data ?? []).some((enrollment) => enrollment?.course_id === smokeCourseId);
  if (!isEnrolled) {
    const enrollmentCreate = await authedApi<EnrollmentCreateResponse>(studentToken, "/api/v1/enrollments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId: smokeCourseId }),
    });
    assertOk(enrollmentCreate.res.ok, `enrollment create failed (${enrollmentCreate.res.status})`);
    assertOk(enrollmentCreate.body?.data?.course?.id === smokeCourseId, "created enrollment course mismatch");
  }

  const refreshedEnrollments = await authedApi<EnrollmentData[]>(studentToken, "/api/v1/enrollments", { method: "GET" });
  assertOk(refreshedEnrollments.res.ok, `refreshed enrollments failed (${refreshedEnrollments.res.status})`);
  assertOk(
    (refreshedEnrollments.body?.data ?? []).some((enrollment) => enrollment?.course_id === smokeCourseId),
    "student is not enrolled in smoke course",
  );

  const courseDetail = await authedApi<CourseDetailData>(studentToken, `/api/v1/courses/${encodeURIComponent(smokeCourseId)}`, { method: "GET" });
  assertOk(courseDetail.res.ok, `course detail failed (${courseDetail.res.status})`);
  const lectureIds = (courseDetail.body?.data?.lectures ?? [])
    .map((lecture) => lecture?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  assertOk(lectureIds.length > 0, "course lectures missing");
  assertOk(lectureIds.includes(smokeLectureId), "smoke lecture missing in course detail");

  const lectureDetail = await authedApi<LectureData>(studentToken, `/api/v1/lectures/${encodeURIComponent(smokeLectureId)}`, { method: "GET" });
  assertOk(lectureDetail.res.ok, `lecture detail failed (${lectureDetail.res.status})`);
  assertOk(lectureDetail.body?.data?.id === smokeLectureId, "lecture detail id mismatch");
  assertOk(lectureDetail.body?.data?.course_id === smokeCourseId, "lecture detail course mapping mismatch");

  const lectureVideo = await authedApi<LectureVideoData>(studentToken, `/api/v1/media/lecture-video/${encodeURIComponent(smokeLectureId)}`, { method: "GET" });
  assertOk(lectureVideo.res.ok, `lecture video mapping failed (${lectureVideo.res.status})`);
  assertOk(lectureVideo.body?.data?.lecture_id === smokeLectureId, "lecture video lecture id mismatch");
  assertOk(
    typeof lectureVideo.body?.data?.asset_key === "string" && lectureVideo.body.data.asset_key.length > 0,
    "lecture video asset key missing",
  );
  assertOk(
    typeof lectureVideo.body?.data?.video_url === "string" && lectureVideo.body.data.video_url.length > 0,
    "lecture video url missing",
  );
  const lectureAssetKey = lectureVideo.body?.data?.asset_key as string;

  const assetMeta = await api<{ asset_key?: string }>(`/api/v1/media/assets/${lectureAssetKey}`, {
    method: "GET",
    headers: authHeader(studentToken),
  });
  if (assetMeta.res.ok) {
    assertOk(assetMeta.body?.data?.asset_key === lectureAssetKey, "asset metadata key mismatch");
  } else {
    assertOk(assetMeta.res.status === 404, `asset metadata failed (${assetMeta.res.status})`);
  }

  if (requirePlayback) {
    const playback = await fetch(`${baseUrl}/api/v1/media/assets/${lectureAssetKey}?token=${encodeURIComponent(studentToken)}`, {
      method: "GET",
      headers: { accept: "video/mp4", range: "bytes=0-1023" },
    });
    assertOk(
      playback.status === 200 || playback.status === 206,
      `playback probe failed (${playbackDebugSummary(playback)})`,
    );
  }

  const transcript = await authedApi<TranscriptData>(studentToken, `/api/v1/media/transcript/${encodeURIComponent(smokeLectureId)}`, { method: "GET" });
  assertOk(transcript.res.ok, `transcript failed (${transcript.res.status})`);
  assertOk(transcript.body?.data?.lecture_id === smokeLectureId, "transcript lecture mismatch");
  assertOk(Array.isArray(transcript.body?.data?.segments), "transcript segments missing");

  const rag = await api<{ chunks?: unknown[] }>("/api/v1/ai/rag", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      query: "핵심 내용을 요약해줘",
      lecture_id: smokeLectureId,
      limit: 3,
    }),
  });
  assertOk(rag.res.ok, `rag failed (${rag.res.status})`);
  assertOk(Array.isArray(rag.body?.data?.chunks), "rag chunks missing");
  assertOk(
    (rag.body?.data?.chunks ?? []).some((chunk: any) =>
      typeof chunk?.start_ms === "number" &&
      chunk.start_ms >= 0 &&
      typeof chunk?.end_ms === "number" &&
      chunk.end_ms > chunk.start_ms &&
      chunk?.lecture_id === smokeLectureId,
    ),
    "rag chunk timestamp/lecture mapping missing",
  );

  const search = await api<{ hits?: Array<{ chunk_index?: number; lecture_id?: string }> }>("/api/v1/ai/search", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      query: "핵심 개념 찾기",
      lecture_id: smokeLectureId,
    }),
  });
  assertOk(search.res.ok, `ai search failed (${search.res.status})`);
  assertOk(Array.isArray(search.body?.data?.hits), "ai search hits missing");
  assertOk(
    (search.body?.data?.hits ?? []).some(
      (hit) =>
        typeof hit?.chunk_index === "number" &&
        hit.chunk_index >= 0 &&
        hit?.lecture_id === smokeLectureId,
    ),
    "ai search hit mapping missing",
  );

  const generated = await api<{ extraction?: { id?: string }; candidates?: Array<{ id?: string; is_selected?: boolean }> }>(
    "/api/v1/shortform/generate",
    {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeader(studentToken) },
      body: JSON.stringify({
        course_id: smokeCourseId,
        lecture_id: smokeLectureId,
        mode: "single",
        style: "highlight",
        target_duration_sec: 120,
        language: "ko",
      }),
    },
  );
  assertOk(generated.res.status === 201, `shortform generate failed (${generated.res.status})`);
  const extractionId = generated.body?.data?.extraction?.id;
  assertOk(typeof extractionId === "string" && extractionId.length > 0, "shortform extraction id missing");

  const selectedCandidateIds = (generated.body?.data?.candidates ?? [])
    .filter((candidate) => candidate?.is_selected)
    .map((candidate) => candidate?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  assertOk(selectedCandidateIds.length > 0, "shortform selected candidates missing");

  const compose = await api<ShortformData>("/api/v1/shortform/compose", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      title: "smoke-shortform",
      description: "smoke compose and callback",
      clips: [
        { lecture_id: smokeLectureId, start_ms: 120000, end_ms: 150000 },
        { lecture_id: smokeLectureId, start_ms: 150000, end_ms: 180000 },
      ],
      candidate_ids: selectedCandidateIds,
    }),
  });
  assertOk(compose.res.status === 201, `shortform compose failed (${compose.res.status})`);
  const shortformId = compose.body?.data?.id;
  assertOk(typeof shortformId === "string" && shortformId.length > 0, "shortform id missing");

  const callback = await api<ShortformData>("/api/v1/shortform/export/callback", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-myway-media-callback-secret": callbackToken,
    },
    body: JSON.stringify({
      video_id: shortformId,
      status: "COMPLETED",
      video_url: `https://cdn.example.com/shortform/${shortformId}.mp4`,
      event_version: 1,
    }),
  });
  assertOk(callback.res.ok, `shortform callback failed (${callback.res.status})`);
  assertOk(callback.body?.data?.export_status === "COMPLETED", "shortform callback state mismatch");

  const video = await authedApi<ShortformData>(studentToken, `/api/v1/shortform/video/${encodeURIComponent(shortformId)}`, {
    method: "GET",
  });
  assertOk(video.res.ok, `shortform video query failed (${video.res.status})`);
  assertOk(video.body?.data?.export_status === "COMPLETED", "shortform export not completed");

  const multiLectureCompose = await api<ShortformData>("/api/v1/shortform/compose", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      title: "smoke-multi-lecture-shortform",
      description: "multi lecture clip compose",
      course_id: "crs_java_01",
      clips: [
        { lecture_id: "lec_java_01", start_ms: 120000, end_ms: 180000 },
        { lecture_id: "lec_java_02", start_ms: 60000, end_ms: 240000 },
      ],
    }),
  });
  assertOk(multiLectureCompose.res.status === 201, `multi lecture shortform compose failed (${multiLectureCompose.res.status})`);
  const multiClips = multiLectureCompose.body?.data?.clips ?? [];
  assertOk(multiClips.length === 2, "multi lecture shortform clips missing");
  assertOk(multiLectureCompose.body?.data?.source_lecture_ids?.includes("lec_java_01"), "multi lecture source #1 missing");
  assertOk(multiLectureCompose.body?.data?.source_lecture_ids?.includes("lec_java_02"), "multi lecture source #2 missing");

  console.log("[smoke] PASS");
  console.log(`[smoke] shortformId=${shortformId}`);
}

run().catch((error: unknown) => {
  console.error("[smoke] FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

