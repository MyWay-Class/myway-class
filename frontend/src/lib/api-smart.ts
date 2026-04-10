import { type SmartChatRequest, type SmartChatResult } from '@myway/shared';
import { getStoredAuth, request, type ApiRequestResult } from './api-core';

export async function sendSmartChatDetailed(
  input: SmartChatRequest,
  sessionToken?: string | null,
): Promise<ApiRequestResult<SmartChatResult> | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  return await request<SmartChatResult>(
    '/api/v1/smart/chat',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );
}

export async function sendSmartChat(
  input: SmartChatRequest,
  sessionToken?: string | null,
): Promise<SmartChatResult | null> {
  const response = await sendSmartChatDetailed(input, sessionToken);
  return response?.success && response.data ? response.data : null;
}
