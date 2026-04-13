import { useEffect, useMemo, useState } from 'react';
import type { AIRecommendationOverview, CourseCard, ShortformCommunityItem } from '@myway/shared';
import { loadShortformCommunity } from '../../../lib/api';
import { resolvePlayableVideoUrl } from '../../../lib/video-url';
import { ShortformCommunityCard } from '../components/ShortformCommunityCard';
import { ShortformCommunityHero } from '../components/ShortformCommunityHero';
import { ShortformPreviewModal } from '../components/ShortformPreviewModal';
import { StatePanel } from '../components/StatePanel';

type CommunityPageProps = {
  courses: CourseCard[];
  recommendations: AIRecommendationOverview | null;
};

type FeedFilter = 'all' | 'popular' | 'saved' | 'recent';
type DetailTab = 'video' | 'clips' | 'info';

function buildFallbackItems(
  courses: CourseCard[],
): ShortformCommunityItem[] {
  return courses.slice(0, 3).map((course) => ({
      id: course.id,
      shortform_id: `shortform-${course.id}`,
      user_id: course.instructor_id,
      title: course.title,
      description: course.description,
      duration_ms: 0,
      total_segments: 0,
      course_id: course.id,
      source_lecture_ids: [],
      status: 'PUBLIC' as const,
      video_url: '',
      export_status: 'COMPLETED' as const,
      export_job_id: null,
      export_result_url: null,
      export_failure_reason: null,
      export_error_message: null,
      export_retry_count: 0,
      updated_at: new Date().toISOString(),
      share_count: 0,
      like_count: 12,
      save_count: 0,
      view_count: 0,
      created_at: new Date().toISOString(),
      clips: [],
      shared_by_name: course.instructor_name,
      course_title: course.category,
      is_saved: false,
      is_liked: false,
    }));
}

function rankItems(items: ShortformCommunityItem[], filter: FeedFilter, query: string): ShortformCommunityItem[] {
  const normalized = query.trim().toLowerCase();

  return [...items]
    .filter((item) => {
      const matchesQuery = normalized
        ? [item.title, item.description, item.course_title, item.shared_by_name, ...item.clips.map((clip) => clip.lecture_title)]
            .join(' ')
            .toLowerCase()
            .includes(normalized)
        : true;

      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'popular'
            ? item.like_count >= 10
            : filter === 'saved'
              ? item.is_saved
              : true;

      return matchesQuery && matchesFilter;
    })
    .sort((left, right) => {
      if (filter === 'recent') {
        return right.updated_at.localeCompare(left.updated_at);
      }

      return right.view_count + right.like_count - (left.view_count + left.like_count);
    });
}

function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) {
    return `${seconds}초`;
  }

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return remain > 0 ? `${minutes}분 ${remain}초` : `${minutes}분`;
}

function shortformSummary(item: ShortformCommunityItem | null): string {
  if (!item) {
    return '선택된 숏폼이 없습니다.';
  }

  if (item.clips.length === 0) {
    return '클립이 아직 준비되지 않았습니다.';
  }

  return `${item.clips.length}개 클립 · ${formatDuration(item.duration_ms)} · ${item.view_count}회 조회`;
}

export function CommunityPage({ courses, recommendations }: CommunityPageProps) {
  const [community, setCommunity] = useState<ShortformCommunityItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ShortformCommunityItem | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [detailTab, setDetailTab] = useState<DetailTab>('video');
  const [query, setQuery] = useState('');
  const enrolledCourses = useMemo(() => courses.filter((course) => course.enrolled), [courses]);

  useEffect(() => {
    let mounted = true;

    if (enrolledCourses.length === 0) {
      setCommunity([]);
      setActiveItemId(null);
      setPreviewItem(null);
      return () => {
        mounted = false;
      };
    }

    void Promise.all(enrolledCourses.map((course) => loadShortformCommunity(course.id))).then((groups) => {
      if (!mounted) {
        return;
      }

      const merged = groups
        .flat()
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);

      setCommunity(merged);
      setActiveItemId((current) => current ?? merged[0]?.id ?? null);
    });

    return () => {
      mounted = false;
    };
  }, [enrolledCourses]);

  const items = useMemo(() => {
    const source = community.length > 0 ? community : buildFallbackItems(enrolledCourses);
    return rankItems(source, filter, query);
  }, [community, enrolledCourses, filter, query]);

  useEffect(() => {
    if (items.length === 0) {
      setActiveItemId(null);
      setDetailTab('video');
      return;
    }

    const isActiveVisible = items.some((item) => item.id === activeItemId);
    if (!isActiveVisible) {
      setActiveItemId(items[0].id);
      setDetailTab('video');
    }
  }, [activeItemId, items]);

  const selectedItem = items.find((item) => item.id === activeItemId) ?? items[0] ?? null;
  const totalClips = items.reduce((sum, item) => sum + item.clips.length, 0);
  const totalViews = items.reduce((sum, item) => sum + item.view_count, 0);
  const totalLikes = items.reduce((sum, item) => sum + item.like_count, 0);
  const selectedClipCount = selectedItem?.clips.length ?? 0;
  const hasEnrolledCourses = enrolledCourses.length > 0;

  return (
    <div className="space-y-6">
      <ShortformCommunityHero totalItems={items.length} totalClips={totalClips} totalViews={totalViews} />

      {!hasEnrolledCourses ? (
        <StatePanel
          icon="ri-book-open-line"
          tone="indigo"
          title="수강 중인 강의가 있어야 숏폼을 볼 수 있습니다."
          description="내 강의에서 수강을 시작하면 해당 강의의 숏폼만 여기에 표시됩니다."
        />
      ) : null}

      <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 강의명, 강사명, 클립 제목 검색"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400"
            />
          </label>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {[
              { key: 'all', label: '전체' },
              { key: 'popular', label: '인기' },
              { key: 'saved', label: '저장됨' },
              { key: 'recent', label: '최신' },
            ].map((item) => {
              const active = filter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key as FeedFilter)}
                  className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${
                    active ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">표시 {items.length}개</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">클립 {totalClips}개</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">좋아요 {totalLikes}개</span>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">숏폼 피드</h2>
              <p className="mt-1 text-[12px] text-slate-500">카드를 누르면 우측에서 바로 재생과 상세를 확인할 수 있습니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.length > 0 ? (
              items.map((item) => (
                <ShortformCommunityCard
                  key={item.id}
                  item={item}
                  active={selectedItem?.id === item.id}
                  onOpen={(next) => {
                    setActiveItemId(next.id);
                    setDetailTab('video');
                  }}
                  onPreview={(next) => setPreviewItem(next)}
                />
              ))
            ) : hasEnrolledCourses ? (
              <div className="md:col-span-2">
                <StatePanel
                  compact
                  icon="ri-search-line"
                  tone="slate"
                  title="조건에 맞는 숏폼이 없습니다."
                  description="검색어와 필터를 바꾸면 다른 숏폼을 다시 찾을 수 있습니다."
                />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">선택한 숏폼</div>
                  <h3 className="mt-1 text-[16px] font-bold text-slate-900">{selectedItem?.title ?? '숏폼을 선택하세요'}</h3>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {selectedItem ? `${selectedItem.course_title} · ${selectedItem.shared_by_name}` : '왼쪽 목록에서 항목을 선택하면 상세가 나타납니다.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(selectedItem)}
                    disabled={!selectedItem}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    미리보기
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItemId(selectedItem?.id ?? null);
                      setDetailTab('video');
                    }}
                    disabled={!selectedItem}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[18px] text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="다시 보기"
                  >
                    <i className="ri-refresh-line" />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[26px] border border-slate-200 bg-slate-950 px-5 py-5 text-white">
                <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                  {[
                    { key: 'video', label: '재생' },
                    { key: 'clips', label: '클립' },
                    { key: 'info', label: '정보' },
                  ].map((tab) => {
                    const active = detailTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDetailTab(tab.key as DetailTab)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                          active ? 'bg-white text-slate-950' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {detailTab === 'video' ? (
                  <div className="mt-4">
                    {(resolvePlayableVideoUrl(selectedItem?.export_result_url ?? undefined) ??
                      (selectedItem?.video_url && !selectedItem.video_url.startsWith('/static/shortforms/')
                        ? resolvePlayableVideoUrl(selectedItem.video_url)
                        : null)) ? (
                      <video
                        className="aspect-video w-full rounded-2xl border border-white/10 bg-black"
                        controls
                        preload="metadata"
                        src={resolvePlayableVideoUrl(selectedItem?.export_result_url ?? undefined) ?? resolvePlayableVideoUrl(selectedItem?.video_url) ?? undefined}
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#111827,#334155)] text-white/70">
                        <div className="text-center">
                          <i className="ri-film-line text-[34px]" />
                          <p className="mt-2 text-[13px]">숏폼 재생 영역</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-white/90">
                      <span className="rounded-full bg-white/10 px-2.5 py-1">{selectedItem?.course_title ?? '강의 미선택'}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1">{selectedItem ? `${selectedItem.clips.length}클립` : '0클립'}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-1">
                        {selectedItem ? formatDuration(selectedItem.duration_ms) : '0초'}
                      </span>
                    </div>
                  </div>
                ) : null}

                {detailTab === 'clips' ? (
                  <div className="mt-4 space-y-2">
                    {selectedItem?.clips.length ? (
                      selectedItem.clips.map((clip, index) => (
                        <div key={`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-[11px] font-bold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-semibold text-white">{clip.lecture_title}</div>
                            <div className="mt-0.5 text-[11px] text-white/60">
                              {clip.label || '구간'} · {formatDuration(clip.end_time_ms - clip.start_time_ms)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-center text-[13px] text-white/60">
                        클립이 아직 없습니다.
                      </div>
                    )}
                  </div>
                ) : null}

                {detailTab === 'info' ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-[13px] leading-7 text-white/80">{selectedItem?.description || '숏폼 재구성 설명이 없습니다.'}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <div className="text-[18px] font-extrabold text-white">{selectedItem?.view_count ?? 0}</div>
                        <div className="text-[11px] text-white/55">조회</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <div className="text-[18px] font-extrabold text-white">{selectedItem?.like_count ?? 0}</div>
                        <div className="text-[11px] text-white/55">좋아요</div>
                      </div>
                      <div className="rounded-2xl bg-white/5 px-3 py-3">
                        <div className="text-[18px] font-extrabold text-white">{selectedItem?.save_count ?? 0}</div>
                        <div className="text-[11px] text-white/55">저장</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="text-[18px] font-extrabold text-slate-900">{selectedItem?.view_count ?? 0}</div>
                  <div className="text-[11px] text-slate-500">조회</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="text-[18px] font-extrabold text-slate-900">{selectedItem?.like_count ?? 0}</div>
                  <div className="text-[11px] text-slate-500">좋아요</div>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-3">
                  <div className="text-[18px] font-extrabold text-slate-900">{selectedItem?.save_count ?? 0}</div>
                  <div className="text-[11px] text-slate-500">저장</div>
                </div>
              </div>
            </section>

            {selectedItem ? (
              <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[15px] font-bold text-slate-900">선택한 숏폼 정보</h4>
                    <p className="mt-1 text-[12px] text-slate-500">현재 항목의 핵심 메타와 클립 구성을 빠르게 확인합니다.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    {selectedClipCount}개 클립
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {selectedItem.clips.length > 0 ? (
                    selectedItem.clips.slice(0, 4).map((clip, index) => (
                      <div key={`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-[11px] font-bold text-indigo-600">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-slate-900">{clip.lecture_title}</div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {clip.label || '구간'} · {formatDuration(clip.end_time_ms - clip.start_time_ms)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <StatePanel
                      compact
                      icon="ri-film-line"
                      tone="slate"
                      title="클립이 아직 없습니다."
                      description="클립이 쌓이면 이 영역에서 세부 구간을 바로 확인할 수 있습니다."
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewItem(selectedItem)}
                  className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-indigo-500"
                >
                  전체 보기
                </button>
              </section>
            ) : (
              <StatePanel
                compact
                icon="ri-book-open-line"
                tone="slate"
                title="선택 가능한 숏폼이 없습니다."
                description="내 강의에서 수강 중인 강의를 먼저 선택하면 해당 강의의 숏폼이 여기에 표시됩니다."
              />
            )}
          </div>
        </aside>
      </section>

      <ShortformPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
