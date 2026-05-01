'use client';

import { KivoMiniTable } from './KivoMiniTable';
import { KivoDocumentCard } from './KivoDocumentCard';
import { KivoExecutionSteps } from './KivoExecutionSteps';

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
                <div className="max-w-[78%] rounded-[24px] bg-[#202024] px-[17px] py-[12px] text-[17px] text-white">
                  {message.content}
                </div>
              </div>
            );
          }

          const assistantText = message.content || (loading ? 'Kivo is thinking…' : '');

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[18px] py-[6px]">

                <KivoDocumentCard document={message.structuredData?.documentCard} />

                <KivoExecutionSteps steps={message.steps} />

                <div className="text-[16px] leading-[1.5]">
                  {assistantText}
                </div>

                <KivoMiniTable table={message.structuredData?.miniTable} />

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
