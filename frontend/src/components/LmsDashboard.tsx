import { useEffect, useState } from 'react';
import { defaultPageForRole, pageTitle } from '../features/lms/config';
import { AppShell } from '../features/lms/components/AppShell';
import { LoginScreen } from '../features/lms/components/LoginScreen';
import { RolePageRouter } from '../features/lms/pages/RolePageRouter';
import type { LmsDashboardProps, LmsPageId } from '../features/lms/types';

export function LmsDashboard(props: LmsDashboardProps) {
  const [activePage, setActivePage] = useState<LmsPageId>(defaultPageForRole(props.session));

  useEffect(() => {
    setActivePage(defaultPageForRole(props.session));
  }, [props.session]);

  if (!props.session) {
    return <LoginScreen demoUsers={props.demoUsers} busy={props.busy} onLogin={props.onLogin} />;
  }

  return (
    <AppShell
      session={props.session}
      activePage={activePage}
      title={pageTitle(activePage, props.session.user.role)}
      onNavigate={setActivePage}
      onLogout={props.onLogout}
    >
      <RolePageRouter
        session={props.session}
        page={activePage}
        dashboard={props.dashboard}
        aiLogs={props.aiLogs}
        enrolledCourses={props.enrolledCourses}
        highlightedLecture={props.highlightedLecture}
        recommendations={props.recommendations}
        courseCards={props.courseCards}
        insights={props.insights}
        providers={props.providers}
        onSelectCourse={props.onSelectCourse}
        demoUsers={props.demoUsers}
      />
    </AppShell>
  );
}
