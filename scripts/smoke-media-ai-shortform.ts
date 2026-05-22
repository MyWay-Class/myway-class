type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string } | null;
  message?: string;
};

type BatchStatusData = {
  success_count?: number;
};

type ShortformData = {
  id?: string;
  export_status?: string;
};

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const callbackToken = process.env.SMOKE_SHORTFORM_CALLBACK_TOKEN || "dev-shortform-callback-token";

function assertOk(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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

  const health = await api<unknown>("/api/v1/health");
  assertOk(health.res.ok, `health check failed (${health.res.status})`);

  const studentToken = await login("usr_std_001");
  const adminToken = await login("usr_admin_001");

  const rag = await api<{ chunks?: unknown[] }>("/api/v1/ai/rag", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      query: "핵심 내용을 요약해줘",
      lecture_id: "lec_java_01",
      limit: 3,
    }),
  });
  assertOk(rag.res.ok, `rag failed (${rag.res.status})`);
  assertOk(Array.isArray(rag.body?.data?.chunks), "rag chunks missing");

  const compose = await api<ShortformData>("/api/v1/shortform/compose", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeader(studentToken) },
    body: JSON.stringify({
      title: "smoke-shortform",
      description: "smoke compose and callback",
      course_id: "crs_java_01",
      clips: [{ lecture_id: "lec_java_01", start_ms: 120000, end_ms: 180000 }],
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
      shortform_id: shortformId,
      status: "COMPLETED",
      video_url: `https://cdn.example.com/shortform/${shortformId}.mp4`,
      event_version: 1,
    }),
  });
  assertOk(callback.res.ok, `shortform callback failed (${callback.res.status})`);
  assertOk(callback.body?.data?.export_status === "COMPLETED", "shortform callback state mismatch");

  const video = await api<ShortformData>(`/api/v1/shortform/video/${encodeURIComponent(shortformId)}`, {
    method: "GET",
    headers: authHeader(studentToken),
  });
  assertOk(video.res.ok, `shortform video query failed (${video.res.status})`);
  assertOk(video.body?.data?.export_status === "COMPLETED", "shortform export not completed");

  const batchStatus = await api<BatchStatusData>("/api/v1/admin/media/batch/status", {
    method: "GET",
    headers: authHeader(adminToken),
  });
  assertOk(batchStatus.res.ok, `admin batch status failed (${batchStatus.res.status})`);
  assertOk(typeof batchStatus.body?.data?.success_count === "number", "batch status malformed");

  console.log("[smoke] PASS");
  console.log(`[smoke] shortformId=${shortformId}`);
}

run().catch((error: unknown) => {
  console.error("[smoke] FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

