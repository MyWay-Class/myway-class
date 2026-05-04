import { useEffect, useMemo, useState } from 'react';
import type { AIRecommendationOverview, CourseCard, CourseDetail, LectureDetail, LoginResponse } from '@myway/shared';
import { CommunityPage } from './CommunityPage';
import { MyShortformsPage } from './MyShortformsPage';
import { ShortformPage } from './ShortformPage';
import { StatePanel } from '../components/StatePanel';

type ShortformTab = 'create' | 'library' | 'community';

type ShortformHubPageProps = {
  session: LoginResponse;
  highlightedLecture: LectureDetail | null;
  selectedCourse: CourseDetail | null;
  courses: CourseCard[];
  sessionToken: string | null;
  recommendations: AIRecommendationOverview | null;
  initialTab?: ShortformTab;
};

const tabs: Array<{ key: ShortformTab; label: string; icon: string; description: string }> = [
  { key: 'create', label: '숏폼 제작', icon: 'ri-scissors-cut-line', description: '수강 중인 강의에서 구간을 골라 제작합니다.' },
  { key: 'library', label: '내 숏폼', icon: 'ri-folder-video-line', description: '만든 숏폼과 저장한 숏폼을 관리합니다.' },
  { key: 'community', label: '숏폼 커뮤니티', icon: 'ri-group-line', description: '수강 중인 강의의 공유 숏폼만 봅니다.' },
];

export function ShortformHubPage({
  session,
  highlightedLecture,
  selectedCourse,
  courses,
  sessionToken,
  recommendations,
  initialTab = 'create',
}: ShortformHubPageProps) {
  const [activeTab, setActiveTab] = useState<ShortformTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const allowedCourses = useMemo(
    () => (session.user.role === 'STUDENT' ? courses.filter((course) => course.enrolled) : courses),
    [courses, session.user.role],
  );

  const allowedSelectedCourse = selectedCourse && allowedCourses.some((course) => course.id === selectedCourse.id) ? selectedCourse : null;
  const selectedCourseTitle = allowedSelectedCourse?.title ?? allowedCourses[0]?.title ?? '선택된 강의 없음';

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_52%,#312e81_100%)] px-6 py-5 text-white shadow-sm lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
              <i className="ri-scissors-cut-line" />
              숏폼 허브
            </div>
            <h2 className="mt-3 text-[24px] font-bold lg:text-[28px]">숏폼 제작, 보관, 공유를 한 흐름으로 관리합니다.</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-white/80">
              아래 탭으로 전환하면 제작, 보관함, 커뮤니티가 같은 흐름 안에서 이어집니다. 학생은 수강 중인 강의만 제작할 수 있습니다.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[12px] text-white/75 backdrop-blur">
            <div className="text-[11px] text-white/70">현재 작업 강좌</div>
            <div className="mt-1 font-semibold text-white">{selectedCourseTitle}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--app-border)] bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-[var(--app-border)] pb-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-w-[180px] rounded-xl border px-4 py-2.5 text-left transition ${
                  active ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-[var(--app-border)] bg-white text-[var(--app-text-secondary)] hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  <i className={`${tab.icon} text-[15px]`} />
                  {tab.label}
                </div>
                <div className={`mt-1 text-[11px] leading-5 ${active ? 'text-white/80' : 'text-[var(--app-text-muted)]'}`}>{tab.description}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {activeTab === 'create' ? (
            allowedCourses.length === 0 ? (
              <StatePanel
                compact
                icon="ri-lock-line"
                tone="amber"
                title="수강 중인 강의가 있어야 숏폼을 만들 수 있습니다."
                description="내 강의에서 수강 신청한 강의를 먼저 열면 그 강의 기준으로만 숏폼을 제작할 수 있습니다."
              />
            ) : (
              <ShortformPage
                highlightedLecture={highlightedLecture}
                selectedCourse={allowedSelectedCourse}
                courses={allowedCourses}
                sessionToken={sessionToken}
              />
            )
          ) : activeTab === 'library' ? (
            <MyShortformsPage courses={allowedCourses} selectedCourse={allowedSelectedCourse} sessionToken={sessionToken} />
          ) : (
            <CommunityPage courses={allowedCourses} recommendations={recommendations} />
          )}
        </div>
      </section>
    </div>
  );
}
