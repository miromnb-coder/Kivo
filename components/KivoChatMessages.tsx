'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
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

type MarkdownBlock =
  | { type: 'empty'; key: string }
  | { type: 'heading'; key: string; level: number; text: string }
  | { type: 'paragraph'; key: string; text: string }
  | { type: 'bullet'; key: string; text: string }
  | { type: 'numbered'; key: string; number: string; text: string }
  | { type: 'quote'; key: string; text: string }
  | { type: 'code'; key: string; language?: string; code: string }
  | { type: 'table'; key: string; rows: string[][] };

const THINKING_MESSAGES = ['Reading your message', 'Understanding the request', 'Planning the answer', 'Preparing the response'];

function normalizeLine(line: string) {
  return line.replace(/\t/g, '  ').trim();
}

function stripMarkdownHeading(line: string) {
  return line.replace(/^\s*#{1,6}\s*/, '').trim();
}

function isTableSeparator(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index] ?? '';
    const trimmed = normalizeLine(rawLine);
    const key = `${index}-${rawLine}`;

    if (!trimmed) {
      blocks.push({ type: 'empty', key });
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```\s*([\w-]+)?\s*$/);
    if (fence) {
      const codeLines: string[] = [];
      const language = fence[1];
      index += 1;

      while (index < lines.length && !normalizeLine(lines[index]).startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({ type: 'code', key, language, code: codeLines.join('\n') });
      continue;
    }

    if (trimmed.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1] ?? '')) {
      const rows = [parseTableRow(rawLine)];
      index += 2;

      while (index < lines.length && normalizeLine(lines[index]).includes('|') && normalizeLine(lines[index])) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: 'table', key, rows });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s*(.*)$/);
    if (heading) {
      const text = stripMarkdownHeading(trimmed);
      if (text) {
        blocks.push({ type: 'heading', key, level: heading[1].length, text });
      }
      index += 1;
      continue;
    }

    const quote = trimmed.match(/^>\s*(.*)$/);
    if (quote) {
      blocks.push({ type: 'quote', key, text: quote[1] ?? '' });
      index += 1;
      continue;
    }

    const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      blocks.push({ type: 'numbered', key, number: numbered[1], text: numbered[2] });
      index += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      blocks.push({ type: 'bullet', key, text: bullet[1] });
      index += 1;
      continue;
    }

    const boldOnly = trimmed.match(/^\*\*(.+?)\*\*:?$/);
    if (boldOnly && trimmed.length < 95) {
      blocks.push({ type: 'heading', key, level: 3, text: boldOnly[1] });
      index += 1;
      continue;
    }

    blocks.push({ type: 'paragraph', key, text: rawLine.replace(/^\s*#{1,6}\s*/, '') });
    index += 1;
  }

  return blocks;
}

function InlineMarkdown({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);

    const value = match[0];
    const bold = value.match(/^\*\*(.+)\*\*$/);
    const code = value.match(/^`(.+)`$/);
    const link = value.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);

    if (bold) {
      nodes.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-[#111114]">
          {bold[1]}
        </strong>,
      );
    } else if (code) {
      nodes.push(
        <code key={`code-${match.index}`} className="rounded-[6px] bg-black/[0.055] px-[5px] py-[2px] font-mono text-[0.92em] text-[#202024]">
          {code[1]}
        </code>,
      );
    } else if (link) {
      nodes.push(
        <a key={`link-${match.index}`} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-[#202024] underline decoration-black/25 underline-offset-[3px]">
          {link[1]}
        </a>,
      );
    }

    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  return <>{nodes.length ? nodes : text}</>;
}

function StreamingCursor() {
  return <span className="ml-[4px] inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#202024]" aria-hidden="true" />;
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === 'empty') return <div className="h-[10px]" />;

  if (block.type === 'heading') {
    const size = block.level <= 1 ? 'text-[24px]' : block.level === 2 ? 'text-[22px]' : 'text-[20px]';
    return (
      <h3 className={`mb-[8px] mt-[18px] first:mt-0 ${size} font-semibold leading-[1.16] tracking-[-0.052em] text-[#141417]`}>
        <InlineMarkdown text={block.text} />
      </h3>
    );
  }

  if (block.type === 'bullet') {
    return (
      <div className="flex gap-[9px] text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]">
        <span className="mt-[11px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#202024]" />
        <span><InlineMarkdown text={block.text} /></span>
      </div>
    );
  }

  if (block.type === 'numbered') {
    return (
      <div className="flex gap-[10px] text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]">
        <span className="min-w-[22px] font-semibold text-[#111114]">{block.number}.</span>
        <span><InlineMarkdown text={block.text} /></span>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-2 border-black/15 pl-[12px] text-[17px] leading-[1.5] tracking-[-0.025em] text-[#66676e]">
        <InlineMarkdown text={block.text} />
      </blockquote>
    );
  }

  if (block.type === 'code') {
    return (
      <div className="my-[10px] overflow-hidden rounded-[18px] border border-black/[0.06] bg-[#f6f6f7]">
        {block.language ? <div className="border-b border-black/[0.05] px-[14px] py-[8px] text-[12px] font-medium uppercase tracking-[0.08em] text-[#8b8c92]">{block.language}</div> : null}
        <pre className="overflow-x-auto px-[14px] py-[12px] text-[13px] leading-[1.55] text-[#202024]"><code>{block.code}</code></pre>
      </div>
    );
  }

  if (block.type === 'table') {
    const [header, ...rows] = block.rows;
    return (
      <div className="my-[10px] overflow-x-auto rounded-[18px] border border-black/[0.06] bg-white/55">
        <table className="w-full min-w-[300px] border-collapse text-left text-[14px] tracking-[-0.015em] text-[#202024]">
          <thead>
            <tr>{header.map((cell, cellIndex) => <th key={cellIndex} className="border-b border-black/[0.06] px-[12px] py-[10px] font-semibold"><InlineMarkdown text={cell} /></th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-black/[0.04] px-[12px] py-[10px] last:border-b-0"><InlineMarkdown text={cell} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <p className="text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]">
      <InlineMarkdown text={block.text} />
    </p>
  );
}

function KivoMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-[6px]">
      {blocks.map((block, index) => {
        const isLastBlock = index === blocks.length - 1;
        return (
          <div key={block.key}>
            <MarkdownBlockView block={block} />
            {streaming && isLastBlock ? <StreamingCursor /> : null}
          </div>
        );
      })}
    </div>
  );
}

function KivoAssistantHeader() {
  return (
    <div className="mb-[12px] flex items-center gap-[8px] text-[#202024]">
      <span className="flex h-[24px] w-[24px] items-center justify-center text-[20px] leading-none" aria-hidden="true">✦</span>
      <span className="font-serif text-[28px] font-semibold leading-none tracking-[-0.045em]">kivo</span>
    </div>
  );
}

function KivoThinkingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setMessageIndex((current) => (current + 1) % THINKING_MESSAGES.length), 1450);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="kivo-thinking" aria-label="Kivo is thinking">
      <style jsx>{`
        .kivo-thinking { color: #73747b; font-size: 17px; line-height: 1.45; letter-spacing: -0.025em; animation: kivo-thinking-in 180ms ease-out both; }
        .kivo-thinking-row { display: inline-flex; max-width: 100%; align-items: flex-end; overflow: hidden; vertical-align: bottom; animation: kivo-thinking-swap 420ms ease-out both; }
        .kivo-thinking-text-wrap { position: relative; display: inline-block; overflow: hidden; }
        .kivo-thinking-text { position: relative; z-index: 1; }
        .kivo-thinking-shimmer { pointer-events: none; position: absolute; z-index: 2; top: -35%; bottom: -35%; left: -62%; width: 44%; transform: translateX(0) skewX(-18deg); background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.92) 50%, transparent 100%); filter: blur(1px); animation: kivo-thinking-shimmer 1450ms ease-in-out infinite; }
        .kivo-thinking-dots { display: inline-flex; width: 24px; gap: 3px; align-items: flex-end; margin-left: 7px; padding-bottom: 4px; }
        .kivo-thinking-dot { width: 4px; height: 4px; border-radius: 999px; background: #73747b; opacity: 0.3; animation: kivo-thinking-dot 1150ms ease-in-out infinite; }
        .kivo-thinking-dot:nth-child(2) { animation-delay: 140ms; }
        .kivo-thinking-dot:nth-child(3) { animation-delay: 280ms; }
        @keyframes kivo-thinking-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kivo-thinking-swap { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes kivo-thinking-shimmer { 0% { transform: translateX(0) skewX(-18deg); opacity: 0; } 18% { opacity: 0.9; } 68% { opacity: 0.9; } 100% { transform: translateX(360%) skewX(-18deg); opacity: 0; } }
        @keyframes kivo-thinking-dot { 0%, 100% { opacity: 0.28; transform: translateY(0) scale(0.78); } 45% { opacity: 1; transform: translateY(-4px) scale(1); } }
      `}</style>

      <span key={THINKING_MESSAGES[messageIndex]} className="kivo-thinking-row">
        <span className="kivo-thinking-text-wrap">
          <span className="kivo-thinking-text">{THINKING_MESSAGES[messageIndex]}</span>
          <span className="kivo-thinking-shimmer" aria-hidden="true" />
        </span>
        <span className="kivo-thinking-dots" aria-hidden="true"><span className="kivo-thinking-dot" /><span className="kivo-thinking-dot" /><span className="kivo-thinking-dot" /></span>
      </span>
    </div>
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
    if (distanceFromBottom < 96) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
                <div className="max-w-[78%] rounded-[18px] bg-white px-[18px] py-[11px] text-[17px] leading-[1.35] tracking-[-0.025em] text-[#202024] shadow-[0_1px_0_rgba(0,0,0,0.025)]">{message.content}</div>
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
                {message.error ? <div className="mt-[12px] rounded-[16px] bg-[#f4f4f5] px-[13px] py-[10px] text-[14px] tracking-[-0.02em] text-[#6f7077]">{message.error}</div> : null}
              </div>
            </div>
          );
        })}
      </div>

      {openDoc ? <KivoDocumentScreen document={openDoc} onClose={() => setOpenDoc(null)} /> : null}
    </div>
  );
}
