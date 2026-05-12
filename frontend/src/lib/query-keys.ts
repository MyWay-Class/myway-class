export const queryKeys = {
  learning: {
    detail: (lectureId: string) => ["learning", "detail", lectureId] as const,
    drafts: (courseId: string) => ["learning", "drafts", courseId] as const,
  },
  media: {
    pipeline: (lectureId: string) => ["media", "pipeline", lectureId] as const,
    transcript: (lectureId: string) => ["media", "transcript", lectureId] as const,
  },
  shortform: {
    list: (paramsKey: string) => ["shortform", "list", paramsKey] as const,
    detail: (id: string) => ["shortform", "detail", id] as const,
  },
  ai: {
    rag: (lectureId: string, query: string) => ["ai", "rag", lectureId, query] as const,
  },
} as const;
