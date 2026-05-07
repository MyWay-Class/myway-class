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
                isUser
                  ? 'bg-[linear-gradient(135deg,#01bee8_0%,#0079b8_100%)] text-white'
                  : 'bg-[linear-gradient(135deg,#f1f8ff_0%,#e9f4ff_100%)] text-[#1c3f60]'
              }`}
            >
              <i className={isUser ? 'ri-user-3-line' : 'ri-robot-2-line'} />
            </div>
            <div
              className={`max-w-[85%] rounded-[22px] px-4 py-3 text-[13px] leading-6 ${
                isUser
                  ? 'bg-[linear-gradient(135deg,#01bee8_0%,#0079b8_100%)] text-white'
                  : 'border border-[#d7e6f5] bg-[linear-gradient(135deg,#ffffff_0%,#f3f9ff_100%)] text-[#1c3f60]'
              }`}
            >
              <p>{sanitizeDisplayText(message.content)}</p>
              {message.references?.length ? (
                <div className="mt-3 space-y-2">
                  {message.references.slice(0, 3).map((reference) => (
                    <div key={reference.id} className="rounded-xl border border-[#c9e0f2] bg-white/90 px-3 py-2 text-[11px] text-[#31516f]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0079b8]">{sanitizeDisplayText(reference.title)}</span>
                        <span className="text-[#6988a7]">{Math.round(reference.similarity * 100)}%</span>
                      </div>
                      <p className="mt-1 text-[#3a5d7d]">{sanitizeDisplayText(reference.excerpt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {message.suggestions?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.slice(0, 4).map((suggestion) => (
                    <span
                      key={suggestion}
                      className="rounded-full border border-[#cae0f2] bg-white/90 px-2.5 py-1 text-[11px] text-[#31516f]"
                    >
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
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f4ff] text-[#5a7a99]">
            <i className="ri-robot-2-line" />
          </div>
          <div className="max-w-[85%] rounded-[22px] border border-[#d7e6f5] bg-[linear-gradient(135deg,#ffffff_0%,#f3f9ff_100%)] px-4 py-4 text-[13px] text-[#5a7a99]">
            답변을 준비하고 있습니다...
          </div>
        </div>
      ) : null}
    </div>
  );
}
