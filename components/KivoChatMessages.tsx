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

type MarkdownInlinePart = {
  text: string;
  bold: boolean;
};

function StepIcon({ status }: { status: KivoChatStep['status'] }) {
  if (status === 'done') return <CheckCircle2 size={15} strokeWidth={2} className="text-[#1f2023]" />;
  if (status === 'active') return <Loader2 size={15} strokeWidth={2} className="animate-spin text-[#1f2023]" />;
  return <Circle size={15} strokeWidth={2} className="text-[#b8b8be]" />;
}

function parseInlineMarkdown(text: string): MarkdownInlinePart[] {
  const parts: MarkdownInlinePart[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }

    if (match[1]) {
      parts.push({ text: match[1], bold: true });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  return parts.length ? parts : [{ text, bold: false }];
}

function MarkdownLine({ line, index }: { line: string; index: number }) {
  const trimmed = line.trim();

  if (!trimmed) {
    return <div key={index} className="h-[10px]" />;
  }

  if (trimmed.startsWith('## ')) {
    return (
      <h2 key={index} className="mt-[16px] first:mt-0 text-[22px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#141417]">
        {trimmed.replace(/^##\s+/, '')}
      </h2>
    );
  }

  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={index} className="mt-[14px] first:mt-0 text-[19px] font-semibold leading-[1.22] tracking-[-0.04em] text-[#18191c]">
        {trimmed.replace(/^###\s+/, '')}
      </h3>
    );
  }

  const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
  if (bulletMatch) {
    return (
      <div key={index} className="flex gap-[9px] text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
        <span className="mt-[10px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#202024]" />
        <span>
          {parseInlineMarkdown(bulletMatch[1]).map((part, partIndex) =>
            part.bold ? <strong key={partIndex} className="font-semibold text-[#111114]">{part.text}</strong> : <span key={partIndex}>{part.text}</span>,
          )}
        </span>
      </div>
    );
  }

  const numberedMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
  if (numberedMatch) {
    const number = trimmed.match(/^\d+/)?.[0] ?? '';
    return (
      <div key={index} className="flex gap-[10px] text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
        <span className="min-w-[20px] font-semibold text-[#111114]">{number}.</span>
        <span>
          {parseInlineMarkdown(numberedMatch[1]).map((part, partIndex) =>
            part.bold ? <strong key={partIndex} className="font-semibold text-[#111114]">{part.text}</strong> : <span key={partIndex}>{part.text}</span>,
          )}
        </span>
      </div>
    );
  }

  return (
    <p key={index} className="text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
      {parseInlineMarkdown(line).map((part, partIndex) =>
        part.bold ? <strong key={partIndex} className="font-semibold text-[#111114]">{part.text}</strong> : <span key={partIndex}>{part.text}</span>,
      )}
    </p>
  );
}

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
