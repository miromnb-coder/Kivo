'use client';

import { useEffect, useRef, useState } from 'react';
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

  const h1 = trimmed.match(/^#{1}\s*(.+)$/);
  if (h1) {
    return (
      <h1 key={index} className="mb-[10px] mt-[20px] first:mt-0 text-[27px] font-semibold leading-[1.12] tracking-[-0.055em] text-[#141417]">
        <InlineMarkdown text={h1[1]} />
      </h1>
    );
  }

  const h2 = trimmed.match(/^#{2}\s*(.+)$/);
  if (h2) {
    return (
      <h2 key={index} className="mb-[8px] mt-[18px] first:mt-0 text-[23px] font-semibold leading-[1.15] tracking-[-0.05em] text-[#141417]">
        <InlineMarkdown text={h2[1]} />
      </h2>
    );
  }

  const h3 = trimmed.match(/^#{3,6}\s*(.+)$/);
  if (h3) {
    return (
      <h3 key={index} className="mb-[7px] mt-[15px] first:mt-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#18191c]">
        <InlineMarkdown text={h3[1]} />
      </h3>
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

  const boldOnly = trimmed.match(/^\*\*(.+?)\*\*:?$/);
  if (boldOnly && trimmed.length < 95) {
    return (
      <h3 key={index} className="mb-[7px] mt-[15px] first:mt-0 text-[19px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#18191c]">
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

function StreamingCursor() {
  return <span className="ml-[4px] inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#202024]" aria-hidden="true" />;
}

function KivoMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const lines = content.split('\n');

  return (
    <div className="animate-[kivoAnswerIn_180ms_ease-out] space-y-[6px] [@keyframes_kivoAnswerIn]:from{opacity:0;transform:translateY(4px)} [@keyframes_kivoAnswerIn]:to{opacity:1;transform:translateY(0)]">
      {lines.map((line, index) => {
        const isLastLine = index === lines.length - 1;

        return (
          <span key={`${index}-${line}`} className="block">
            <MarkdownLine line={line} index={index} />
            {streaming && isLastLine ? <StreamingCursor /> : null}
          </span>
        );
      })}
    </div>
  );
}

function KivoAssistantHeader() {
  return (
    <div className="mb-[12px] flex items-center gap-[8px] text-[#202024]">
      <span className="flex h-[24px] w-[24px] items-center justify-center text-[20px] leading-none" aria-hidden="true">
        ✦
      </span>
      <span className="font-serif text-[28px] font-semibold leading-none tracking-[-0.045em]">kivo</span>
    </div>
  );
}

function KivoThinkingState() {
  return (
    <p className="animate-[kivoThinkingIn_160ms_ease-out] text-[17px] leading-[1.45] tracking-[-0.025em] text-[#73747b] [@keyframes_kivoThinkingIn]:from{opacity:0;transform:translateY(3px)} [@keyframes_kivoThinkingIn]:to{opacity:1;transform:translateY(0)]" aria-label="Kivo is thinking">
      Kivo is thinking ...
    </p>
  );
}

function shouldShowExecutionSteps(message: KivoChatMessage) {
  return Boolean(message.browserPreview || message.structuredData?.showExecutionSteps || message.structuredData?.documentCard);
}

export function KivoChatMessages({ messages, loading }: any) {
  const [openDoc, setOpenDoc] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousContentLengthRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    const latestMessage = messages[messages.length - 1];
    const latestContentLength = latestMessage?.content?.length ?? 0;
    const contentGrew = latestContentLength !== previousContentLengthRef.current;
    previousContentLengthRef.current = latestContentLength;

    if (!el || !contentGrew) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 96;

    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div ref={scrollRef} className="absolute inset-x-0 top-[94px] bottom-[142px] z-10 overflow-y-auto px-[18px] pb-[24px] pt-[12px] overscroll-contain">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-[26px]">
        {messages.map((message: KivoChatMessage, index: number) => {
          const isUser = message.role === 'user';

          if (isUser) {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-[18px] bg-white px-[18px] py-[11px] text-[17px] leading-[1.35] tracking-[-0.025em] text-[#202024] shadow-[0_1px_0_rgba(0,0,0,0.025)]">
                  {message.content}
                </div>
              </div>
            );
          }

          const isLatestMessage = index === messages.length - 1;
          const isActiveAssistant = loading && isLatestMessage && !message.error;
          const isThinking = isActiveAssistant && !message.content;
          const isStreaming = isActiveAssistant && Boolean(message.content);
          const showExecutionSteps = shouldShowExecutionSteps(message);

          return (
            <div key={message.id} className="flex justify-start">
              <div className="w-full px-[8px] py-[2px]">
                <KivoAssistantHeader />
                <KivoDocumentCard document={message.structuredData?.documentCard} onOpen={(doc) => setOpenDoc(doc)} />
                <KivoMiniBrowserPreview preview={message.browserPreview} />
                {showExecutionSteps ? <KivoExecutionSteps steps={message.steps} /> : null}

                {isThinking ? <KivoThinkingState /> : null}
                {message.content ? <KivoMarkdown content={message.content} streaming={isStreaming} /> : null}

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
