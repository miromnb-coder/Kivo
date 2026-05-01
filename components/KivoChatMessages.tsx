'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { KivoMiniTable } from './KivoMiniTable';

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

function StepIcon({ status }: { status: KivoChatStep['status'] }) {
  if (status === 'done') return <CheckCircle2 size={15} strokeWidth={2} className="text-[#1f2023]" />;
  if (status === 'active') return <Loader2 size={15} strokeWidth={2} className="animate-spin text-[#1f2023]" />;
  return <Circle size={15} strokeWidth={2} className="text-[#b8b8be]" />;
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

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full rounded-[28px] border border-[#eeeeF1] bg-white/78 px-[18px] py-[16px] shadow-[0_14px_34px_rgba(15,23,42,0.055)] backdrop-blur-[18px]">
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

                <div className="whitespace-pre-wrap text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
                  {message.content || (loading ? 'Kivo is thinking…' : '')}
                </div>

                {/* 🔥 MINI TABLE RENDER */}
                <KivoMiniTable table={message.structuredData?.miniTable} />

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
