'use client';

import { useState } from 'react';
import { KivoMiniTable } from './KivoMiniTable';
import { KivoDocumentCard } from './KivoDocumentCard';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoDocumentScreen } from './KivoDocumentScreen';

export type KivoChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: any[];
  structuredData?: any;
};

export function KivoChatMessages({ messages, loading }: any) {
  const [openDoc, setOpenDoc] = useState<any>(null);

  if (messages.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-[94px] bottom-[142px] z-10 overflow-y-auto px-[18px] pb-[24px] pt-[12px]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-[18px]">
        {messages.map((message: any) => {
          const isUser = message.role === 'user';

          if (isUser) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-[24px] bg-[#202024] px-[17px] py-[12px] text-[17px] text-white">
                  {message.content}
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[18px] py-[6px]">
                <KivoDocumentCard
                  document={message.structuredData?.documentCard}
                  onOpen={(doc) => setOpenDoc(doc)}
                />

                {message.steps && <KivoExecutionSteps steps={message.steps} />}

                <div className="text-[17px] text-[#202024]">{message.content}</div>

                <KivoMiniTable table={message.structuredData?.miniTable} />
              </div>
            </div>
          );
        })}
      </div>

      {openDoc && (
        <KivoDocumentScreen
          document={openDoc}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </div>
  );
}
