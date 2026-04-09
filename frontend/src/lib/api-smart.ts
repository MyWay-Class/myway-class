import { type SmartChatRequest, type SmartChatResult } from '@myway/shared';
import { getStoredAuth, request } from './api-core';

export async function sendSmartChat(
  input: SmartChatRequest,
  sessionToken?: string | null,
): Promise<SmartChatResult | null> {
  const token = sessionToken ?? getStoredAuth()?.session_token ?? null;

  if (!token) {
    return null;
  }

  const response = await request<SmartChatResult>(
    '/api/v1/smart/chat',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    token,
  );

  return response?.success && response.data ? response.data : null;
}
