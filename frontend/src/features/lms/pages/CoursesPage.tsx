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
      <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#070b1b_0%,#1b2250_48%,#5b21b6_100%)] px-6 py-7 text-white shadow-[0_30px_70px_rgba(15,23,42,0.16)] lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">강의 상세</span>
            <h3 className="mt-3 text-[26px] font-extrabold tracking-[-0.05em] lg:text-[32px]">선택한 강의의 상세 정보와 차시를 한 화면에서 봅니다.</h3>
            <p className="mt-2 text-[13px] leading-6 text-white/78">차시, 공지, 자료, 시청으로 이어지는 핵심 흐름을 유지합니다.</p>
          </div>
          {selectedCourse ? (
            <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
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
