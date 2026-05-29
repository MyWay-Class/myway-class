import type { AIProviderCatalog } from '@myway/shared';
import { getAIProviderCatalog } from '@myway/shared';
import {
  AdminAutomationHero,
  AdminAutomationPipelineSection,
  AdminAutomationProviderSection,
  AdminAutomationRules,
  AdminAutomationToolCards,
} from './AdminAutomationPageSections';
import { useAdminAutomationPipeline } from './useAdminAutomationPipeline';

type AdminAutomationPageProps = {
  providerCatalog: AIProviderCatalog | null;
};

export function AdminAutomationPage({ providerCatalog }: AdminAutomationPageProps) {
  const resolvedCatalog = providerCatalog ?? getAIProviderCatalog();
  const { pipelineLoading, pipelineError, rerunBusyMode, normalizedStatus, refreshPipelineStatus, handleRerun } = useAdminAutomationPipeline();

  return (
    <div className="space-y-5">
      <AdminAutomationHero />
      <AdminAutomationToolCards />
      <AdminAutomationRules />
      <AdminAutomationPipelineSection
        pipelineLoading={pipelineLoading}
        pipelineError={pipelineError}
        rerunBusyMode={rerunBusyMode}
        normalizedStatus={normalizedStatus}
        onRerun={(mode) => void handleRerun(mode)}
        onRefresh={() => void refreshPipelineStatus()}
      />
      <AdminAutomationProviderSection providerCatalog={resolvedCatalog} />
    </div>
  );
}
