import { useMemo, useState } from 'react';
import {
  canEnroll,
  canManageCourses,
  demoUsers as defaultDemoUsers,
  type AuthUser,
  type AILogOverview,
  type AIInsights,
  type AIProviderCatalog,
  type AIRecommendationOverview,
  type AIUserSettings,
  type CourseCard,
  type CourseDetail,
  type Dashboard,
  type LectureDetail,
  type LoginResponse,
} from '@myway/shared';
import {
  getCurrentRoleLabel,
} from './lib/api';
import {
  addCourseMaterialFlow,
  addCourseNoticeFlow,
  completeLectureFlow,
} from './lib/course-flow';
import { refreshLearningState } from './lib/app-state';
import { LmsDashboard } from './components/LmsDashboard';
import { useAppActions } from './hooks/useAppActions';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { useAppSelectionSync } from './hooks/useAppSelectionSync';

export default function App() {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [aiLogs, setAILogs] = useState<AILogOverview | null>(null);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [providers, setProviders] = useState<AIProviderCatalog | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendationOverview | null>(null);
  const [settings, setSettings] = useState<AIUserSettings | null>(null);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [selectedLecture, setSelectedLecture] = useState<LectureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [notice, setNotice] = useState('로그인 후 내 정보와 진도가 활성화됩니다.');
  const [loginUsers, setLoginUsers] = useState<AuthUser[]>(defaultDemoUsers);

  const enrolledCourses = useMemo(() => {
    if (!session) {
      return [];
    }

    if (session.user.role === 'STUDENT') {
      return courseCards.filter((course) => course.enrolled);
    }

    return dashboard?.courses.filter((course) => course.enrolled) ?? [];
  }, [courseCards, dashboard, session]);

  const canEnrollCurrent = session ? canEnroll(session.user.role) : false;
  const canManageCurrent = session ? canManageCourses(session.user.role) : false;
  const learningDeps = {
    setCourseCards,
    setSelectedCourseId,
    setDashboard,
    setAILogs,
    setInsights,
    setProviders,
    setRecommendations,
    setSettings,
    setNotice,
  };

  useAppBootstrap({ setSession, setApiStatus, setLoginUsers, setLoading, learningDeps });
  useAppSelectionSync({
    courseCards,
    selectedCourseId,
    selectedCourse,
    selectedLectureId,
    session,
    setSelectedCourse,
    setSelectedCourseId,
    setSelectedLectureId,
    setSelectedLecture,
  });

  const { handleLogin, handleLogout, handleSaveAISettings, handleEnroll, handleCreateCourse } = useAppActions({
    session,
    canEnrollCurrent,
    canManageCurrent,
    setSession,
    setBusy,
    setNotice,
    setSettings,
    setSelectedCourse,
    setSelectedCourseId,
    setSelectedLectureId,
    setSelectedLecture,
    learningDeps,
  });

  const flowDeps = {
    session,
    selectedCourse,
    selectedCourseId,
    canManageCurrent,
    setBusy,
    setNotice,
    setSelectedCourse,
    setSelectedLecture,
    refreshLearningState: (activeSession: LoginResponse | null) => refreshLearningState(learningDeps, activeSession),
    setInsights,
  };
  const highlightedLecture = selectedLecture ?? null;
  return (
    <LmsDashboard
      busy={busy}
      canEnrollCurrent={canEnrollCurrent}
      canManageCurrent={canManageCurrent}
      apiStatus={apiStatus}
      courseCards={courseCards}
      dashboard={dashboard}
      aiLogs={aiLogs}
      demoUsers={loginUsers}
      enrolledCourses={enrolledCourses}
      getCurrentRoleLabel={getCurrentRoleLabel}
      highlightedLecture={highlightedLecture}
      loading={loading}
      notice={notice}
      insights={insights}
      providers={providers}
      recommendations={recommendations}
      settings={settings}
      onCompleteLecture={(lectureId) => void completeLectureFlow(flowDeps, lectureId)}
      onAddMaterial={(input) => addCourseMaterialFlow(flowDeps, input)}
      onAddNotice={(input) => addCourseNoticeFlow(flowDeps, input)}
      onCreateCourse={handleCreateCourse}
      onEnroll={(courseId) => void handleEnroll(courseId)}
      onLogin={(userId) => void handleLogin(userId)}
      onLogout={() => void handleLogout()}
      onSaveAISettings={handleSaveAISettings}
      onSelectCourse={setSelectedCourseId}
      onSelectLecture={setSelectedLectureId}
      selectedCourse={selectedCourse}
      selectedCourseId={selectedCourseId}
      selectedLectureId={selectedLectureId}
      session={session}
    />
  );
}
