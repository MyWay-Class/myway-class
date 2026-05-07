import { lazy, Suspense, useEffect, useState } from 'react';
import { defaultPageForRole, pageTitle } from '../features/lms/config';
import { AppShell } from '../features/lms/components/AppShell';
import { StatePanel } from '../features/lms/components/StatePanel';
import { LoginScreen } from '../features/lms/components/LoginScreen';
import type { LmsDashboardProps, LmsPageId } from '../features/lms/types';

const PublicHomePage = lazy(async () => {
  const mod = await import('../features/lms/pages/PublicHomePage');
  return { default: mod.PublicHomePage };
});

const RolePageRouter = lazy(async () => {
  const mod = await import('../features/lms/pages/RolePageRouter');
  return { default: mod.RolePageRouter };
});

export function LmsDashboard(props: LmsDashboardProps) {
  const [activePage, setActivePage] = useState<LmsPageId>(defaultPageForRole(props.session));
  const [showAuthPage, setShowAuthPage] = useState(false);
  const activeNavKey =
    activePage === 'courses' || activePage === 'lecture-watch'
      ? 'my-courses'
      : activePage === 'shortform' || activePage === 'community' || activePage === 'my-shortforms'
        ? 'shortform'
      : activePage;

  function goToHome() {
    setActivePage(defaultPageForRole(props.session));
    props.onSelectCourse('');
    props.onSelectLecture('');
  }

  useEffect(() => {
    setActivePage(defaultPageForRole(props.session));
  }, [props.session]);

  useEffect(() => {
    if (props.session) {
      setShowAuthPage(false);
    }
  }, [props.session]);

  if (props.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] px-4">
        <div className="w-full max-w-2xl">
          <StatePanel
            icon="ri-loader-4-line animate-spin"
            tone="indigo"
            title="학습 화면을 불러오는 중입니다."
            description="로그인 정보, 강의 목록, 대시보드 상태를 동기화하고 있습니다. 잠시만 기다려 주세요."
          />
        </div>
      </div>
    );
  }

  if (!props.session) {
    return showAuthPage ? (
      <LoginScreen
        demoUsers={props.demoUsers}
        busy={props.busy}
        onLogin={props.onLogin}
        onBackToHome={() => setShowAuthPage(false)}
      />
    ) : (
      <Suspense fallback={<PageLoadingFallback />}>
        <PublicHomePage
          courseCards={props.courseCards}
          busy={props.busy}
          onOpenLogin={() => setShowAuthPage(true)}
        />
      </Suspense>
    );
  }

  return (
      <AppShell
        session={props.session}
        activePage={activePage}
        activeNavKey={activeNavKey}
        title={pageTitle(activePage, props.session.user.role)}
        onNavigate={(page) => {
          setActivePage(page);
          if (page === 'home') {
            goToHome();
          }
        }}
        onHome={goToHome}
        onLogout={props.onLogout}
      >
      {props.apiStatus === 'offline' ? (
        <div className="mb-5">
          <StatePanel
            compact
            icon="ri-wifi-off-line"
            tone="amber"
            title="API 연결이 불안정합니다."
            description="마지막으로 동기화된 데이터가 표시됩니다. 네트워크가 복구되면 자동으로 최신 상태를 다시 불러옵니다."
          />
        </div>
      ) : null}
      <Suspense fallback={<PageLoadingFallback compact />}>
        <RolePageRouter
          busy={props.busy}
          session={props.session}
          page={activePage}
          loading={props.loading}
          dashboard={props.dashboard}
          aiLogs={props.aiLogs}
          enrolledCourses={props.enrolledCourses}
          highlightedLecture={props.highlightedLecture}
          recommendations={props.recommendations}
          courseCards={props.courseCards}
          insights={props.insights}
          providers={props.providers}
          onCreateCourse={props.onCreateCourse}
          onEnroll={props.onEnroll}
          onSelectCourse={props.onSelectCourse}
          onSelectLecture={props.onSelectLecture}
          demoUsers={props.demoUsers}
          selectedCourse={props.selectedCourse}
          selectedLectureId={props.selectedLectureId}
          onNavigate={setActivePage}
        />
      </Suspense>
    </AppShell>
  );
}

function PageLoadingFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${compact ? 'py-4' : 'flex min-h-screen items-center justify-center bg-[#f8f9fb] px-4'}`}>
      <div className={`${compact ? 'w-full' : 'w-full max-w-2xl'}`}>
        <StatePanel
          icon="ri-loader-4-line animate-spin"
          tone="indigo"
          title="화면을 준비하고 있습니다."
          description="코드와 데이터를 불러오는 중입니다. 잠시만 기다려 주세요."
        />
      </div>
    </div>
  );
}
