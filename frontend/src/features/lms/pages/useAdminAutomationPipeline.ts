import { useEffect, useMemo, useState } from 'react';
import {
  loadBatchPipelineStatus,
  rerunBatchPipeline,
  type BatchPipelineRerunMode,
  type BatchPipelineStatus,
} from '../../../lib/api-admin-automation';
import { normalizeBatchPipelineStatus } from './admin-automation-utils';

export function useAdminAutomationPipeline() {
  const [pipelineStatus, setPipelineStatus] = useState<BatchPipelineStatus | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [rerunBusyMode, setRerunBusyMode] = useState<BatchPipelineRerunMode | null>(null);

  async function refreshPipelineStatus() {
    setPipelineLoading(true);
    setPipelineError(null);
    try {
      const status = await loadBatchPipelineStatus();
      setPipelineStatus(normalizeBatchPipelineStatus(status));
    } catch {
      setPipelineError('배치 파이프라인 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setPipelineStatus(normalizeBatchPipelineStatus(null));
    } finally {
      setPipelineLoading(false);
    }
  }

  useEffect(() => {
    void refreshPipelineStatus();
  }, []);

  async function handleRerun(mode: BatchPipelineRerunMode) {
    setRerunBusyMode(mode);
    setPipelineError(null);
    try {
      const result = await rerunBatchPipeline(mode);
      if (!result) {
        setPipelineError('재실행 요청이 접수되지 않았습니다. 권한/서버 상태를 확인해 주세요.');
        return;
      }
      if (result.status) setPipelineStatus(normalizeBatchPipelineStatus(result.status));
      else await refreshPipelineStatus();
    } catch {
      setPipelineError('재실행 요청 중 오류가 발생했습니다.');
    } finally {
      setRerunBusyMode(null);
    }
  }

  const normalizedStatus = useMemo(() => normalizeBatchPipelineStatus(pipelineStatus), [pipelineStatus]);
  return { pipelineLoading, pipelineError, rerunBusyMode, normalizedStatus, refreshPipelineStatus, handleRerun };
}
