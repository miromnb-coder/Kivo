'use client';

import { useState } from 'react';
import { KivoMiniTable } from './KivoMiniTable';
import { KivoDocumentCard } from './KivoDocumentCard';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoDocumentScreen } from './KivoDocumentScreen';
import { KivoMiniBrowserPreview } from './KivoMiniBrowserPreview';

export type KivoChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: any[];
  browserPreview?: any;
  model?: string;
  provider?: string;
  error?: string;
  structuredData?: any;
};

// (rest unchanged...)

export function KivoChatMessages({ messages, loading }: any) {
  const [openDoc, setOpenDoc] = useState<any>(null);

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

          const assistantText = message.content || (loading ? 'Kivo is thinking…' : '');

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[18px] py-[6px]">
                <KivoDocumentCard document={message.structuredData?.documentCard} onOpen={(doc) => setOpenDoc(doc)} />

                {/* 🔥 NEW: browser preview */}
                <KivoMiniBrowserPreview preview={message.browserPreview} />

                <KivoExecutionSteps steps={message.steps} />
                <KivoMarkdown content={assistantText} />
                <KivoMiniTable table={message.structuredData?.miniTable} />

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

      {openDoc ? <KivoDocumentScreen document={openDoc} onClose={() => setOpenDoc(null)} /> : null}
    </div>
  );
}
