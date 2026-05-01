'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { KivoMiniTable } from './KivoMiniTable';
import { KivoDocumentCard } from './KivoDocumentCard';

export type KivoChatStep = {
  label: string;
  status: 'active' | 'done' | 'pending';
};

export type KivoChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: KivoChatStep[];
  model?: string;
  provider?: string;
  error?: string;
  structuredData?: any;
};

// ... (rest unchanged until render)

function KivoMarkdown({ content }: { content: string }) {
  return <div className="space-y-[6px]">{content.split('\n').map((line, index) => <MarkdownLine key={`${index}-${line}`} line={line} index={index} />)}</div>;
}

export function KivoChatMessages({ messages, loading }: any) {
  if (messages.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-[94px] bottom-[142px] z-10 overflow-y-auto px-[18px] pb-[24px] pt-[12px] overscroll-contain">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-[18px]">
        {messages.map((message: any) => {
          const isUser = message.role === 'user';

          if (isUser) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-[24px] bg-[#202024] px-[17px] py-[12px] text-[17px] leading-[1.35] tracking-[-0.025em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  {message.content}
                </div>
              </div>
            );
          }

          const insight = message.structuredData?.gmail?.insight;
          const assistantText = message.content || (loading ? 'Kivo is thinking…' : '');

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[18px] py-[6px]">

                {/* DOCUMENT CARD (new, safe) */}
                <KivoDocumentCard document={message.structuredData?.documentCard} />

                {message.steps?.length ? (
                  <div className="mb-[14px] rounded-[20px] bg-[#f4f4f5] px-[14px] py-[12px]">
                    <div className="mb-[9px] text-[12px] font-medium uppercase tracking-[0.14em] text-[#8d8d93]">Agent steps</div>
                    <div className="space-y-[8px]">
                      {message.steps.map((step: any) => (
                        <div key={step.label} className="flex items-center gap-[9px] text-[15px] leading-none tracking-[-0.02em] text-[#4f5056]">
                          <StepIcon status={step.status} />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <KivoMarkdown content={assistantText} />
                </div>

                <KivoMiniTable table={message.structuredData?.miniTable} />

                {insight ? (
                  <div className="mt-[12px] text-[13px] text-[#5f6066] leading-[1.5]">
                    {insight.summary}
                  </div>
                ) : null}

                {message.model || message.provider ? (
                  <div className="mt-[13px] text-[12px] tracking-[-0.01em] text-[#a0a1a7]">
                    {message.provider ? message.provider : 'model'} · {message.model}
                  </div>
                ) : null}

                {message.error ? (
                  <div className="mt-[12px] rounded-[16px] bg-[#f4f4f5] px-[13px] py-[10px] text-[14px] tracking-[-0.02em] text-[#6f7077]">
                    {message.error}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
