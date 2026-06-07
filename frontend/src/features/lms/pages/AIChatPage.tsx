import type { AIInsights, LectureDetail } from '@myway/shared';
import { AIChatPageConversation, AIChatPageHero } from './AIChatPageSections';
import { useAIChatPageState } from './useAIChatPageState';

type AIChatPageProps = {
  highlightedLecture: LectureDetail | null;
  insights: AIInsights | null;
  selectedCourse?: { enrolled: boolean } | null;
  canManageCurrent?: boolean;
  sessionToken?: string | null;
};

export function AIChatPage({ highlightedLecture, insights, selectedCourse, canManageCurrent, sessionToken }: AIChatPageProps) {
  const {
    ragOverview,
    ragLoading,
    messages,
    input,
    sending,
    sidebarOpen,
    bannerTitle,
    bannerDescription,
    bannerMeta,
    isLocked,
    quickPrompts,
    setInput,
    setSidebarOpen,
    handleSubmit,
  } = useAIChatPageState({ highlightedLecture, insights, selectedCourse, canManageCurrent, sessionToken });

  return (
    <div className="space-y-5">
      <AIChatPageHero
        highlightedLecture={highlightedLecture}
        isLocked={isLocked}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
      />

      <AIChatPageConversation
        highlightedLecture={highlightedLecture}
        insights={insights}
        isLocked={isLocked}
        messages={messages}
        sending={sending}
        input={input}
        bannerTitle={bannerTitle}
        bannerDescription={bannerDescription}
        bannerMeta={bannerMeta}
        ragOverview={ragOverview}
        ragLoading={ragLoading}
        sidebarOpen={sidebarOpen}
        quickPrompts={quickPrompts}
        onChangeInput={setInput}
        onSubmit={() => void handleSubmit()}
        onQuickPrompt={(prompt) => {
          setInput(prompt);
          void handleSubmit(prompt);
        }}
        onCloseSidebar={() => setSidebarOpen(false)}
      />
    </div>
  );
}
