import { useEffect, useState } from 'react';
import type { CourseCard, CourseDetail, LectureDetail } from '@myway/shared';
import { CourseExploreDetailPanel } from '../components/CourseExploreDetailPanel';
import { StatePanel } from '../components/StatePanel';
import type { LmsPageId } from '../types';

type CoursesPageProps = {
  courses: CourseCard[];
  selectedCourse: CourseDetail | null;
  highlightedLecture: LectureDetail | null;
  selectedLectureId: string;
  canManageCurrent: boolean;
  busy: boolean;
  sessionToken?: string | null;
  onEnroll: (courseId: string) => void;
  onCreateCourse: (input: import('@myway/shared').CourseCreateRequest) => Promise<import('@myway/shared').CourseDetail | null>;
  onNavigate: (page: LmsPageId) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectLecture: (lectureId: string) => void;
};

type CourseTab = '강의' | '공지' | '자료';

export function CoursesPage({
  selectedCourse,
  highlightedLecture,
  selectedLectureId,
  canManageCurrent,
  sessionToken,
  onEnroll,
  onNavigate,
  onSelectLecture,
}: CoursesPageProps) {
  const [activeTab, setActiveTab] = useState<CourseTab>('강의');

  useEffect(() => {
    setActiveTab('강의');
  }, [selectedCourse?.id]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-cyan-200/20 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#f8fcff_0%,#f0f9ff_45%,#ecfeff_100%)] px-6 py-6 shadow-sm lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">강의 상세</span>
            <h3 className="mt-3 text-[24px] font-extrabold tracking-[-0.03em] text-slate-900 lg:text-[28px]">강의 핵심 정보와 차시를 빠르게 확인하세요.</h3>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">차시, 공지, 자료, 시청 흐름을 한 화면에서 이어봅니다.</p>
          </div>
          {selectedCourse ? (
            <div className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-[11px] font-semibold text-cyan-700">
              현재 선택: {selectedCourse.title}
            </div>
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          {selectedCourse ? (
            <CourseExploreDetailPanel
              course={selectedCourse}
              highlightedLecture={highlightedLecture}
              selectedLectureId={selectedLectureId}
              viewMode="detail"
              activeTab={activeTab}
              canManageCurrent={canManageCurrent}
              sessionToken={sessionToken}
              onSelectLecture={onSelectLecture}
              onEnroll={onEnroll}
              onTabChange={setActiveTab}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="xl:col-span-2">
              <StatePanel
                compact
                icon="ri-cursor-line"
                tone="violet"
                title="강의를 선택하세요."
                description="대시보드나 내 강의에서 카드를 눌러 강의 상세 페이지로 이동할 수 있습니다."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
