import type { AIReference, AIIntentResult } from '@myway/shared';

type ChatRole = 'assistant' | 'user';

export type AIChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  references?: AIReference[];
  suggestions?: string[];
  intent?: AIIntentResult | null;
};

type AIChatThreadProps = {
  messages: AIChatMessage[];
  loading: boolean;
};

function sanitizeDisplayText(value: string): string {
  const collapsed = value.replace(/\uFFFD/g, '').replace(/\?{3,}/g, '…').trim();
  return collapsed.length > 0 ? collapsed : '내용을 불러오지 못했습니다.';
}

export function AIChatThread({ messages, loading }: AIChatThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div
              className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <i className={isUser ? 'ri-user-3-line' : 'ri-robot-2-line'} />
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-6 ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <p>{sanitizeDisplayText(message.content)}</p>
              {message.references?.length ? (
                <div className="mt-3 space-y-2">
                  {message.references.slice(0, 3).map((reference) => (
                    <div key={reference.id} className="rounded-xl bg-white/60 px-3 py-2 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-indigo-600">{sanitizeDisplayText(reference.title)}</span>
                        <span className="text-slate-400">{Math.round(reference.similarity * 100)}%</span>
                      </div>
                      <p className="mt-1 text-slate-500">{sanitizeDisplayText(reference.excerpt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {message.suggestions?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.slice(0, 4).map((suggestion) => (
                    <span key={suggestion} className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-slate-500">
                      {sanitizeDisplayText(suggestion)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {loading ? (
        <div className="flex gap-3">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <i className="ri-robot-2-line" />
          </div>
          <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-4 text-[13px] text-slate-400">
            답변을 준비하고 있습니다...
          </div>
        </div>
      ) : null}
    </div>
  );
}
