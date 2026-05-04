'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircleMore, Mic, Plus } from 'lucide-react';
import { KivoPlusSheet } from './KivoPlusSheet';
import { KivoConnectorsSheet } from './KivoConnectorsSheet';
import { KivoModePopover } from './KivoModePopover';
import { KivoVoiceRecorderBar } from './KivoVoiceRecorderBar';

type KivoComposerProps = {
  onFocusChange?: (focused: boolean) => void;
  onSubmitMessage?: (message: string) => Promise<void> | void;
  disabled?: boolean;
};

type VisualViewportState = {
  height: number;
  offsetTop: number;
};

function KivoToolsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="9" r="1.8" fill="currentColor" />
      <circle cx="12" cy="15" r="1.8" fill="currentColor" />
      <circle cx="17" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

function CircleButton({ children, muted = false, onClick }: { children: React.ReactNode; muted?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#eeeeef] text-[#cfcfd4]' : 'border-[#e9e9ec] bg-[#f9f9fa] text-[#202024]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer({ onFocusChange, onSubmitMessage, disabled = false }: KivoComposerProps) {
  const [value, setValue] = useState('');
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [visualViewportState, setVisualViewportState] = useState<VisualViewportState>({
    height: 0,
    offsetTop: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canSend = value.trim().length > 0 && !disabled;

  const updateVisualViewportState = useCallback(() => {
    const viewport = window.visualViewport;
    setVisualViewportState({
      height: viewport?.height ?? window.innerHeight,
      offsetTop: viewport?.offsetTop ?? 0,
    });
  }, []);

  const syncKeyboardPosition = useCallback(() => {
    updateVisualViewportState();
    requestAnimationFrame(updateVisualViewportState);
    window.setTimeout(updateVisualViewportState, 80);
    window.setTimeout(updateVisualViewportState, 180);
  }, [updateVisualViewportState]);

  useEffect(() => {
    updateVisualViewportState();
    window.visualViewport?.addEventListener('resize', updateVisualViewportState);
    window.visualViewport?.addEventListener('scroll', updateVisualViewportState);
    window.addEventListener('resize', updateVisualViewportState);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateVisualViewportState);
      window.visualViewport?.removeEventListener('scroll', updateVisualViewportState);
      window.removeEventListener('resize', updateVisualViewportState);
    };
  }, [updateVisualViewportState]);

  useEffect(() => {
    if (!isRecording) return;

    const interval = window.setInterval(() => {
      setRecordSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '24px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }

  function handleSubmit() {
    const message = value.trim();
    if (!message || disabled) return;

    setValue('');
    onSubmitMessage?.(message);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = '24px';
    });
  }

  function startRecording() {
    setIsPlusOpen(false);
    setIsConnectorsOpen(false);
    setIsModeOpen(false);
    setRecordSeconds(0);
    setIsRecording(true);
  }

  function stopRecording() {
    setIsRecording(false);
    setRecordSeconds(0);
  }

  const viewportHeight = visualViewportState.height || window.innerHeight;
  const keyboardOffset = Math.max(0, window.innerHeight - viewportHeight - visualViewportState.offsetTop);

  return (
    <>
      {!isRecording ? (
        <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none px-[16px] pb-[18px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform" style={{ transform: `translate3d(0, -${keyboardOffset}px, 0)` }}>
          <div className="mx-auto w-full max-w-[430px] rounded-[34px] border border-[#eeeeF1] bg-[#f9f9fa] px-[16px] pt-[14px] pb-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] pointer-events-auto">
            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              placeholder="Ask anything or assign a task"
              disabled={disabled}
              onFocus={() => {
                if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                onFocusChange?.(true);
                syncKeyboardPosition();
              }}
              onBlur={() => {
                blurTimeoutRef.current = setTimeout(() => {
                  onFocusChange?.(false);
                  updateVisualViewportState();
                }, 120);
              }}
              onChange={(event) => {
                setValue(event.target.value);
                requestAnimationFrame(resizeTextarea);
                requestAnimationFrame(updateVisualViewportState);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              className="block h-[24px] max-h-[96px] w-full resize-none overflow-y-auto bg-transparent px-[4px] text-[17px] leading-[24px] tracking-[-0.02em] text-[#202024] outline-none placeholder:text-[#a7a7ad] disabled:opacity-70"
            />

            <div className="mt-[14px] flex items-center justify-between">
              <div className="flex items-center gap-[14px]">
                <CircleButton onClick={() => setIsPlusOpen(true)}>
                  <Plus size={22} strokeWidth={1.6} />
                </CircleButton>
                <CircleButton onClick={() => setIsConnectorsOpen(true)}>
                  <KivoToolsIcon />
                </CircleButton>
              </div>

              <div className="flex items-center gap-[8px]">
                <CircleButton onClick={() => setIsModeOpen(true)}>
                  <MessageCircleMore size={20} strokeWidth={1.6} />
                </CircleButton>
                <CircleButton onClick={startRecording}>
                  <Mic size={20} strokeWidth={1.7} />
                </CircleButton>
                <button
                  type="button"
                  aria-label="Send message"
                  disabled={!canSend}
                  onClick={handleSubmit}
                  className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border ${
                    canSend ? 'border-transparent bg-[#202024] text-white' : 'border-transparent bg-[#eeeeef] text-[#cfcfd4]'
                  }`}
                >
                  <ArrowUp size={22} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <KivoVoiceRecorderBar open={isRecording} seconds={recordSeconds} onCancel={stopRecording} onConfirm={stopRecording} />
      <KivoPlusSheet open={isPlusOpen} onClose={() => setIsPlusOpen(false)} />
      <KivoConnectorsSheet open={isConnectorsOpen} onClose={() => setIsConnectorsOpen(false)} />
      <KivoModePopover open={isModeOpen} onClose={() => setIsModeOpen(false)} />
    </>
  );
}
