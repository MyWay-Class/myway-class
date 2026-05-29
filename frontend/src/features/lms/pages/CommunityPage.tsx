import { useEffect, useState } from 'react';
import type { AIRecommendationOverview, CourseCard, ShortformCommunityItem } from '@myway/shared';
import { loadShortformCommunity } from '../../../lib/api';
import { ShortformCommunityHero } from '../components/ShortformCommunityHero';
import { ShortformPreviewModal } from '../components/ShortformPreviewModal';
import { StatePanel } from '../components/StatePanel';
import { CommunityDetailPanel, CommunityFeedGrid, CommunityFilterBar, type DetailTab } from './CommunityPageSections';
import { type FeedFilter, useCommunityDerived } from './useCommunityDerived';

type CommunityPageProps = {
  courses: CourseCard[];
  recommendations: AIRecommendationOverview | null;
};

export function CommunityPage({ courses }: CommunityPageProps) {
  const [community, setCommunity] = useState<ShortformCommunityItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ShortformCommunityItem | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [detailTab, setDetailTab] = useState<DetailTab>('video');
  const [query, setQuery] = useState('');
  const { enrolledCourses, items, selectedItem, totalClips, totalViews, totalLikes, hasEnrolledCourses, hasRealFeed } = useCommunityDerived(
    courses,
    community,
    filter,
    query,
    activeItemId,
    setActiveItemId,
    setDetailTab,
  );

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
      if (!mounted) return;
      const merged = groups.flat().filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);
      setCommunity(merged);
      setActiveItemId((current) => current ?? merged[0]?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [enrolledCourses]);

  return (
    <div className="space-y-6">
      <ShortformCommunityHero totalItems={items.length} totalClips={totalClips} totalViews={totalViews} />
      {!hasEnrolledCourses ? (
        <StatePanel icon="ri-book-open-line" tone="indigo" title="수강 중인 강의가 있어야 숏폼을 볼 수 있습니다." description="내 강의에서 수강을 시작하면 해당 강의의 숏폼만 여기에 표시됩니다." />
      ) : null}
      <CommunityFilterBar query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} itemsCount={items.length} totalClips={totalClips} totalLikes={totalLikes} />
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="space-y-4">
          <div><h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-slate-900">숏폼 피드</h2><p className="mt-1 text-[12px] text-slate-500">카드를 누르면 우측에서 바로 재생과 상세를 확인할 수 있습니다.</p></div>
          <CommunityFeedGrid hasRealFeed={hasRealFeed} hasEnrolledCourses={hasEnrolledCourses} query={query} items={items} selectedItemId={selectedItem?.id} onOpenItem={(id) => { setActiveItemId(id); setDetailTab('video'); }} onPreview={(item) => setPreviewItem(item)} />
        </div>
        <aside className="space-y-4">
          <div className="sticky top-20 space-y-4">
            <CommunityDetailPanel selectedItem={selectedItem} detailTab={detailTab} setDetailTab={setDetailTab} setPreviewItem={setPreviewItem} setActiveItemId={setActiveItemId} />
          </div>
        </aside>
      </section>
      <ShortformPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
}
