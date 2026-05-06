'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Copy, MoreHorizontal, Share, Volume2 } from 'lucide-react';
import { KivoMiniTable } from './KivoMiniTable';
import { KivoExecutionSteps } from './KivoExecutionSteps';
import { KivoMiniBrowserPreview } from './KivoMiniBrowserPreview';
import { KivoMessageAttachments, type KivoAttachment } from './KivoAttachments';

export type KivoChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: KivoAttachment[];
  steps?: any[];
  browserPreview?: any;
  model?: string;
  provider?: string;
  error?: string;
  structuredData?: any;
};

function InlineText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    const value = match[0];
    const bold = value.match(/^\*\*(.+)\*\*$/);
    const code = value.match(/^`(.+)`$/);
    const plainUrl = value.match(/^https?:\/\/[^\s)]+$/);

    if (bold) nodes.push(<strong key={`bold-${match.index}`} className="font-semibold text-[#111114]">{bold[1]}</strong>);
    else if (code) nodes.push(<code key={`code-${match.index}`} className="rounded-[6px] bg-black/[0.055] px-[5px] py-[2px] font-mono text-[0.92em] text-[#202024]">{code[1]}</code>);
    else if (plainUrl) nodes.push(<a key={`plain-link-${match.index}`} href={value} target="_blank" rel="noreferrer" className="font-medium text-[#202024] underline decoration-black/25 underline-offset-[3px]">{value}</a>);
    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) nodes.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  return <>{nodes.length ? nodes : text}</>;
}

function KivoMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  const blocks = useMemo(() => content.split('\n').map((line) => line.trimEnd()), [content]);

  return (
    <div className="space-y-[8px]">
      {blocks.map((line, index) => {
        const key = `${index}-${line}`;
        if (!line.trim()) return <div key={key} className="h-[6px]" />;
        if (line.startsWith('### ')) return <h3 key={key} className="mt-[14px] text-[20px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#141417]"><InlineText text={line.replace(/^###\s+/, '')} /></h3>;
        if (line.startsWith('## ')) return <h3 key={key} className="mt-[16px] text-[22px] font-semibold leading-[1.16] tracking-[-0.05em] text-[#141417]"><InlineText text={line.replace(/^##\s+/, '')} /></h3>;
        if (line.startsWith('# ')) return <h3 key={key} className="mt-[18px] text-[24px] font-semibold leading-[1.14] tracking-[-0.052em] text-[#141417]"><InlineText text={line.replace(/^#\s+/, '')} /></h3>;
        if (/^[-*•]\s+/.test(line)) {
          return (
            <div key={key} className="flex gap-[9px] text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]">
              <span className="mt-[11px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#202024]" />
              <span><InlineText text={line.replace(/^[-*•]\s+/, '')} /></span>
            </div>
          );
        }
        return <p key={key} className="text-[17px] leading-[1.5] tracking-[-0.025em] text-[#202024]"><InlineText text={line} />{streaming && index === blocks.length - 1 ? <span className="ml-[4px] inline-block h-[8px] w-[8px] animate-pulse rounded-full bg-[#202024]" /> : null}</p>;
      })}
    </div>
  );
}

function KivoAssistantHeader() {
  return (
    <div className="mb-[12px] flex items-center gap-[9px] text-[#202024]">
      <img src="/avatar.PNG" alt="Kivo" className="h-[38px] w-[38px] shrink-0 object-contain" draggable={false} />
      <span className="font-serif text-[28px] font-semibold leading-none tracking-[-0.045em]">kivo</span>
    </div>
  );
}

function KivoAssistantActions({ content, disabled = false }: { content: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copyResponse() {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function readResponse() {
    if (!content.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  async function shareResponse() {
    if (!content.trim()) return;
    try {
      if (navigator.share) {
        await navigator.share({ text: content });
        return;
      }
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  const buttonClass = 'flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#6f7077] transition duration-150 hover:bg-black/[0.045] hover:text-[#202024] active:scale-95 disabled:pointer-events-none disabled:opacity-35';

  return (
    <div className="mt-[12px] flex items-center gap-[6px] text-[#6f7077]" aria-label="Assistant response actions">
      <button type="button" aria-label="Copy response" onClick={copyResponse} disabled={disabled || !content.trim()} className={buttonClass}><Copy className="h-[19px] w-[19px]" strokeWidth={2.05} /></button>
      <button type="button" aria-label="Read response aloud" onClick={readResponse} disabled={disabled || !content.trim()} className={buttonClass}><Volume2 className="h-[20px] w-[20px]" strokeWidth={2.05} /></button>
      <button type="button" aria-label="Share response" onClick={shareResponse} disabled={disabled || !content.trim()} className={buttonClass}><Share className="h-[20px] w-[20px]" strokeWidth={2.05} /></button>
      <button type="button" aria-label="More response actions" disabled={disabled} className={buttonClass}><MoreHorizontal className="h-[22px] w-[22px]" strokeWidth={2.05} /></button>
      {copied ? <span className="ml-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8b8c92]">Copied</span> : null}
    </div>
  );
}

function KivoThinkingState() {
  return (
    <div className="text-[17px] leading-[1.45] tracking-[-0.025em] text-[#73747b]">
      Reading your message<span className="ml-[6px] inline-flex gap-[3px] align-middle"><span className="h-[4px] w-[4px] animate-bounce rounded-full bg-[#73747b]" /><span className="h-[4px] w-[4px] animate-bounce rounded-full bg-[#73747b] [animation-delay:120ms]" /><span className="h-[4px] w-[4px] animate-bounce rounded-full bg-[#73747b] [animation-delay:240ms]" /></span>
    </div>
  );
}

function ScrollToBottomButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Scroll to latest message"
      onClick={onClick}
      className={`absolute bottom-[20px] right-[24px] z-30 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-[#202024] shadow-[0_14px_36px_rgba(15,23,42,0.14)] backdrop-blur-xl transition duration-200 active:scale-95 ${visible ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0'}`}
    >
      <ArrowDown className="h-[21px] w-[21px]" strokeWidth={2.35} />
    </button>
  );
}

export function KivoChatMessages({ messages, loading }: { messages: KivoChatMessage[]; loading: boolean }) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowScrollButton(false);
  };

  const updateScrollButton = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 120);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButton();
    el.addEventListener('scroll', updateScrollButton, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButton);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 160) scrollToBottom('smooth');
    else setShowScrollButton(true);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="absolute inset-x-0 top-[94px] bottom-[142px] z-10">
      <div ref={scrollRef} className="h-full overflow-y-auto px-[18px] pb-[24px] pt-[12px] overscroll-contain">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-[26px]">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            if (isUser) {
              return (
                <div key={message.id} className="flex justify-end">
                  <div className="flex max-w-[78%] flex-col items-end">
                    <KivoMessageAttachments attachments={message.attachments} />
                    {message.content ? (
                      <div className="rounded-[18px] bg-white px-[18px] py-[11px] text-[17px] leading-[1.35] tracking-[-0.025em] text-[#202024] shadow-[0_1px_0_rgba(0,0,0,0.025)]">
                        {message.content}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            }

            const isLatestMessage = index === messages.length - 1;
            const isActiveAssistant = loading && isLatestMessage && !message.error;
            const isThinking = isActiveAssistant && !message.content;
            const isStreaming = isActiveAssistant && Boolean(message.content);

            return (
              <div key={message.id} className="flex justify-start">
                <div className="w-full px-[8px] py-[2px]">
                  <KivoAssistantHeader />
                  <KivoMiniBrowserPreview preview={message.browserPreview} />
                  {message.steps?.length ? <KivoExecutionSteps steps={message.steps} /> : null}
                  {isThinking ? <KivoThinkingState /> : null}
                  {message.content ? <KivoMarkdown content={message.content} streaming={isStreaming} /> : null}
                  <KivoMiniTable table={message.structuredData?.miniTable} />
                  {message.error ? <div className="mt-[12px] rounded-[16px] bg-[#f4f4f5] px-[13px] py-[10px] text-[14px] tracking-[-0.02em] text-[#6f7077]">{message.error}</div> : null}
                  {message.content || message.error ? <KivoAssistantActions content={message.content || message.error || ''} disabled={isActiveAssistant} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ScrollToBottomButton visible={showScrollButton} onClick={() => scrollToBottom('smooth')} />
    </div>
  );
}
