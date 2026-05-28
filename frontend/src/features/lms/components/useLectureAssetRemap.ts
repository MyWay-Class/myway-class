import { useState } from 'react';
import { saveLectureVideoMappingDetailed } from '../../../lib/api-media';

export function useLectureAssetRemap(sessionToken?: string | null) {
  const [remapAssetKey, setRemapAssetKey] = useState('');
  const [remapBusy, setRemapBusy] = useState(false);
  const [remapMessage, setRemapMessage] = useState<string | null>(null);

  const handleRemapAssetKey = async (lectureId?: string | null) => {
    if (!lectureId || !remapAssetKey.trim()) {
      setRemapMessage('asset key를 입력해 주세요.');
      return;
    }

    setRemapBusy(true);
    setRemapMessage(null);
    const response = await saveLectureVideoMappingDetailed(
      { lecture_id: lectureId, asset_key: remapAssetKey.trim() },
      sessionToken,
    );
    setRemapBusy(false);
    setRemapMessage(response?.success ? '재매핑 저장 완료' : (response?.error?.message ?? '재매핑 실패'));
  };

  return {
    remapAssetKey,
    setRemapAssetKey,
    remapBusy,
    remapMessage,
    handleRemapAssetKey,
  };
}
