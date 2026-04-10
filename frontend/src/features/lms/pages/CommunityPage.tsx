import { useEffect, useMemo, useState } from 'react';
import type { AIRecommendationOverview, CourseCard, ShortformCommunityItem } from '@myway/shared';
import { loadShortformCommunity } from '../../../lib/api';
import { ShortformCommunityCard } from '../components/ShortformCommunityCard';
import { ShortformCommunityHero } from '../components/ShortformCommunityHero';
import { ShortformPreviewModal } from '../components/ShortformPreviewModal';

type CommunityPageProps = {
  courses: CourseCard[];
  recommendations: AIRecommendationOverview | null;
};

function buildFallbackItems(
  courses: CourseCard[],
  recommendations: AIRecommendationOverview | null,
): ShortformCommunityItem[] {
  const fallback = recommendations?.recommendations.slice(0, 3).map((item) => ({
    id: item.id,
    shortform_id: `shortform-${item.id}`,
    user_id: item.id,
    title: item.title,
    description: `${item.category} · ${item.instructor_name}`,
    duration_ms: 0,
    total_segments: 0,
    course_id: item.id,
    source_lecture_ids: [],
    status: 'PUBLIC' as const,
    video_url: '',
    share_count: 0,
    like_count: 12,
    save_count: 0,
    view_count: 0,
    created_at: new Date().toISOString(),
    clips: [],
    shared_by_name: item.instructor_name,
    course_title: item.category,
    is_saved: false,
    is_liked: false,
  })) ?? courses.slice(0, 3).map((course) => ({
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

  return fallback;
}

export function CommunityPage({ courses, recommendations }: CommunityPageProps) {
  const [community, setCommunity] = useState<ShortformCommunityItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void loadShortformCommunity().then((items) => {
      if (!mounted) {
        return;
      }

      setCommunity(items);
      setActiveItemId((current) => current ?? items[0]?.id ?? null);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(() => {
    return community.length > 0 ? community : buildFallbackItems(courses, recommendations);
  }, [community, courses, recommendations]);

  const selectedItem = items.find((item) => item.id === activeItemId) ?? items[0] ?? null;
  const modalItem = items.find((item) => item.id === activeItemId) ?? null;

  const totalClips = items.reduce((sum, item) => sum + item.clips.length, 0);
  const totalViews = items.reduce((sum, item) => sum + item.view_count, 0);

  return (
    <div className="space-y-5">
      <ShortformCommunityHero totalItems={items.length} totalClips={totalClips} totalViews={totalViews} />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ShortformCommunityCard
            key={item.id}
            item={item}
            active={selectedItem?.id === item.id}
            onOpen={(next) => setActiveItemId(next.id)}
          />
        ))}
      </section>

      {selectedItem ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-slate-900">상세 미리보기</h3>
              <p className="mt-1 text-[12px] text-slate-500">
                {selectedItem.course_title} · {selectedItem.shared_by_name}
              </p>
              <p className="mt-3 text-[13px] leading-7 text-slate-600">
                {selectedItem.description || '숏폼 재구성 설명이 없습니다.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[240px]">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">{selectedItem.clips.length}</div>
                <div className="text-[11px] text-slate-500">클립</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">
                  {Math.max(1, Math.round(selectedItem.duration_ms / 60000))}
                </div>
                <div className="text-[11px] text-slate-500">분</div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[18px] font-extrabold text-slate-900">{selectedItem.view_count}</div>
                <div className="text-[11px] text-slate-500">조회</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[13px] font-semibold">미리보기</div>
              <div className="text-[11px] text-white/60">{selectedItem.clips.length}개 클립</div>
            </div>
            <div className="mt-4 aspect-video rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#111827,#334155)] flex items-center justify-center text-white/60">
              <div className="text-center">
                <i className="ri-film-line text-[34px]" />
                <p className="mt-2 text-[13px]">숏폼 미리보기</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ShortformPreviewModal item={modalItem} onClose={() => setActiveItemId(null)} />
    </div>
  );
}
