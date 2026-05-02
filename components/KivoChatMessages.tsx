'use client';

import { KivoMiniTable } from './KivoMiniTable';
import { KivoDocumentCard } from './KivoDocumentCard';
import { KivoExecutionSteps } from './KivoExecutionSteps';

export type KivoChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: any[];
  model?: string;
  provider?: string;
  error?: string;
  structuredData?: any;
};

type InlinePart = {
  text: string;
  bold: boolean;
};

function parseInlineMarkdown(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    if (match[1]) parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), bold: false });
  return parts.length ? parts : [{ text, bold: false }];
}

function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {parseInlineMarkdown(text).map((part, index) =>
        part.bold ? (
          <strong key={`${part.text}-${index}`} className="font-semibold text-[#111114]">
            {part.text}
          </strong>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

function normalizeLine(line: string) {
  return line.replace(/\t/g, '  ').trim();
}

function MarkdownLine({ line, index }: { line: string; index: number }) {
  const trimmed = normalizeLine(line);

  if (!trimmed) return <div key={index} className="h-[10px]" />;

  const h2 = trimmed.match(/^#{2}\s*(.+)$/);
  if (h2) {
    return (
      <h2 key={index} className="mt-[18px] first:mt-0 text-[23px] font-semibold leading-[1.15] tracking-[-0.05em] text-[#141417]">
        <InlineMarkdown text={h2[1]} />
      </h2>
    );
  }

  const h3 = trimmed.match(/^#{3}\s*(.+)$/);
  if (h3) {
    return (
      <h3 key={index} className="mt-[15px] first:mt-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#18191c]">
        <InlineMarkdown text={h3[1]} />
      </h3>
    );
  }

  const bullet = trimmed.match(/^\s*[-*•]\s*(.+)$/);
  if (bullet) {
    return (
      <div key={index} className="flex gap-[9px] text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
        <span className="mt-[10px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#202024]" />
        <span>
          <InlineMarkdown text={bullet[1]} />
        </span>
      </div>
    );
  }

  const numbered = trimmed.match(/^\s*(\d+)[.)]\s*(.+)$/);
  if (numbered) {
    return (
      <div key={index} className="flex gap-[10px] text-[17px] leading-[1.48] tracking-[-0.025em] text-[#202024]">
        <span className="min-w-[22px] font-semibold text-[#111114]">{numbered[1]}.</span>
        <span>
          <InlineMarkdown text={numbered[2]} />
        </span>
      </div>
    );
  }

  const boldOnly = trimmed.match(/^\*\*(.+)\*\*:?$/);
  if (boldOnly && trimmed.length < 90) {
    return (
      <h3 key={index} className="mt-[15px] first:mt-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#18191c]">
        <InlineMarkdown text={trimmed} />
      </h3>
    );
  }

  return (
    <p key={index} className="text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]">
      <InlineMarkdown text={line} />
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

          const assistantText = message.content || (loading ? 'Kivo is thinking…' : '');

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[18px] py-[6px]">
                <KivoDocumentCard document={message.structuredData?.documentCard} />
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
    </div>
  );
}
