import type { ShortformCommunityItem } from '@myway/shared';
import { resolvePlayableVideoUrl } from '../../../lib/video-url';
import { ShortformCommunityCard } from '../components/ShortformCommunityCard';
import { StatePanel } from '../components/StatePanel';
import { formatDuration, shortformSummary, type FeedFilter } from './useCommunityDerived';

export type DetailTab = 'video' | 'clips' | 'info';

export function CommunityFilterBar({
  query, setQuery, filter, setFilter, itemsCount, totalClips, totalLikes,
}: {
  query: string; setQuery: (v: string) => void; filter: FeedFilter; setFilter: (v: FeedFilter) => void; itemsCount: number; totalClips: number; totalLikes: number;
}) {
  return <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end"><label className="block"><span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목, 강의명, 강사명, 클립 제목 검색" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400" /></label><div className="flex flex-wrap gap-2 lg:justify-end">{[{ key: 'all', label: '전체' }, { key: 'popular', label: '인기' }, { key: 'saved', label: '저장됨' }, { key: 'recent', label: '최신' }].map((item) => { const active = filter === item.key; return <button key={item.key} type="button" onClick={() => setFilter(item.key as FeedFilter)} className={`rounded-full px-4 py-2 text-[12px] font-semibold transition ${active ? 'bg-cyan-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700'}`}>{item.label}</button>; })}</div></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">표시 {itemsCount}개</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">클립 {totalClips}개</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">좋아요 {totalLikes}개</span></div></section>;
}

export function CommunityFeedGrid({
  hasRealFeed, hasEnrolledCourses, query, items, selectedItemId, onOpenItem, onPreview,
}: {
  hasRealFeed: boolean; hasEnrolledCourses: boolean; query: string; items: ShortformCommunityItem[]; selectedItemId: string | undefined; onOpenItem: (id: string) => void; onPreview: (item: ShortformCommunityItem) => void;
}) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{hasRealFeed ? items.map((item) => <ShortformCommunityCard key={item.id} item={item} active={selectedItemId === item.id} onOpen={(next) => onOpenItem(next.id)} onPreview={(next) => onPreview(next)} />) : hasEnrolledCourses ? <div className="md:col-span-2"><StatePanel compact icon="ri-rss-line" tone="slate" title={query.trim() ? '조건에 맞는 숏폼이 없습니다.' : '공개된 숏폼 피드가 아직 없습니다.'} description={query.trim() ? '검색어와 필터를 바꾸면 다른 숏폼을 다시 찾을 수 있습니다.' : '강의의 숏폼이 공유되면 실데이터 피드가 이 영역에 표시됩니다.'} /></div> : null}</div>;
}

export function CommunityDetailPanel({
  selectedItem, detailTab, setDetailTab, setPreviewItem, setActiveItemId,
}: {
  selectedItem: ShortformCommunityItem | null; detailTab: DetailTab; setDetailTab: (v: DetailTab) => void; setPreviewItem: (item: ShortformCommunityItem | null) => void; setActiveItemId: (id: string | null) => void;
}) {
  return <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">선택한 숏폼</div><h3 className="mt-1 text-[16px] font-bold text-slate-900">{selectedItem?.title ?? '숏폼을 선택하세요'}</h3><p className="mt-1 text-[12px] text-slate-500">{selectedItem ? `${selectedItem.course_title} · ${selectedItem.shared_by_name}` : '왼쪽 목록에서 항목을 선택하면 상세가 나타납니다.'}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setPreviewItem(selectedItem)} disabled={!selectedItem} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50">미리보기</button><button type="button" onClick={() => { setActiveItemId(selectedItem?.id ?? null); setDetailTab('video'); }} disabled={!selectedItem} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[18px] text-slate-500 transition hover:border-cyan-200 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50" title="다시 보기"><i className="ri-refresh-line" /></button></div></div><div className="mt-4 rounded-[26px] border border-slate-200 bg-slate-950 px-5 py-5 text-white"><div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">{[{ key: 'video', label: '재생' }, { key: 'clips', label: '클립' }, { key: 'info', label: '정보' }].map((tab) => { const active = detailTab === tab.key; return <button key={tab.key} type="button" onClick={() => setDetailTab(tab.key as DetailTab)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${active ? 'bg-white text-slate-950' : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'}`}>{tab.label}</button>; })}</div>{detailTab === 'video' ? <VideoTab item={selectedItem} /> : null}{detailTab === 'clips' ? <ClipsTab item={selectedItem} /> : null}{detailTab === 'info' ? <InfoTab item={selectedItem} /> : null}</div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] text-slate-600"><span className="font-semibold text-slate-700">요약:</span> {shortformSummary(selectedItem)}</div></section>;
}

function VideoTab({ item }: { item: ShortformCommunityItem | null }) {
  const playable = resolvePlayableVideoUrl(item?.export_result_url ?? undefined) ?? (item?.video_url && !item.video_url.startsWith('/static/shortforms/') ? resolvePlayableVideoUrl(item.video_url) : null);
  return <div className="mt-4">{playable ? <video className="aspect-video w-full rounded-2xl border border-white/10 bg-black" controls preload="metadata" src={playable ?? undefined} /> : <div className="flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#111827,#334155)] text-white/70"><div className="text-center"><i className="ri-film-line text-[34px]" /><p className="mt-2 text-[13px]">숏폼 재생 영역</p></div></div>}<div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-white/90"><span className="rounded-full bg-white/10 px-2.5 py-1">{item?.course_title ?? '강의 미선택'}</span><span className="rounded-full bg-white/10 px-2.5 py-1">{item ? `${item.clips.length}클립` : '0클립'}</span><span className="rounded-full bg-white/10 px-2.5 py-1">{item ? formatDuration(item.duration_ms) : '0초'}</span></div></div>;
}

function ClipsTab({ item }: { item: ShortformCommunityItem | null }) {
  return <div className="mt-4 space-y-2">{item?.clips.length ? item.clips.map((clip, index) => <div key={`${clip.lecture_id}:${clip.start_time_ms}:${clip.end_time_ms}`} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-[11px] font-bold text-white">{index + 1}</div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-white">{clip.lecture_title}</div><div className="mt-0.5 text-[11px] text-white/60">{clip.label || '구간'} · {formatDuration(clip.end_time_ms - clip.start_time_ms)}</div></div></div>) : <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-center text-[13px] text-white/60">클립이 아직 없습니다.</div>}</div>;
}

function InfoTab({ item }: { item: ShortformCommunityItem | null }) {
  return <div className="mt-4 space-y-3"><p className="text-[13px] leading-7 text-white/80">{item?.description || '숏폼 재구성 설명이 없습니다.'}</p><div className="grid grid-cols-3 gap-2 text-center"><Metric value={item?.view_count ?? 0} label="조회" /><Metric value={item?.like_count ?? 0} label="좋아요" /><Metric value={item?.save_count ?? 0} label="저장" /></div></div>;
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl bg-white/5 px-3 py-3"><div className="text-[18px] font-extrabold text-white">{value}</div><div className="text-[11px] text-white/55">{label}</div></div>;
}
