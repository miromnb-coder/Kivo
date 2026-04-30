'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircleMore, Mic, Plus } from 'lucide-react';

type KivoComposerProps = {
  onFocusChange?: (focused: boolean) => void;
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

function CircleButton({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      type="button"
      className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#eeeeef] text-[#cfcfd4]' : 'border-[#e9e9ec] bg-[#f9f9fa] text-[#202024]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer({ onFocusChange }: KivoComposerProps) {
  const [value, setValue] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseViewportHeightRef = useRef<number>(0);
  const canSend = value.trim().length > 0;

  const captureBaseViewportHeight = useCallback(() => {
    const viewport = window.visualViewport;
    const currentHeight = viewport?.height ?? window.innerHeight;

    if (!baseViewportHeightRef.current || currentHeight > baseViewportHeightRef.current) {
      baseViewportHeightRef.current = currentHeight;
    }
  }, []);

  const updateKeyboardOffset = useCallback(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      setKeyboardOffset(0);
      return;
    }

    const baseHeight = baseViewportHeightRef.current || window.innerHeight;
    const offset = Math.max(0, baseHeight - viewport.height - viewport.offsetTop);
    setKeyboardOffset(offset > 80 ? offset : 0);
  }, []);

  const syncKeyboardPosition = useCallback(() => {
    captureBaseViewportHeight();
    updateKeyboardOffset();
    requestAnimationFrame(updateKeyboardOffset);
    window.setTimeout(updateKeyboardOffset, 60);
    window.setTimeout(updateKeyboardOffset, 140);
    window.setTimeout(updateKeyboardOffset, 280);
  }, [captureBaseViewportHeight, updateKeyboardOffset]);

  useEffect(() => {
    captureBaseViewportHeight();
    updateKeyboardOffset();
    window.visualViewport?.addEventListener('resize', updateKeyboardOffset);
    window.visualViewport?.addEventListener('scroll', updateKeyboardOffset);
    window.addEventListener('resize', captureBaseViewportHeight);
    window.addEventListener('resize', updateKeyboardOffset);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardOffset);
      window.visualViewport?.removeEventListener('scroll', updateKeyboardOffset);
      window.removeEventListener('resize', captureBaseViewportHeight);
      window.removeEventListener('resize', updateKeyboardOffset);
    };
  }, [captureBaseViewportHeight, updateKeyboardOffset]);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '24px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }

  function handleSubmit() {
    const message = value.trim();
    if (!message) return;

    console.log('Kivo composer submit:', message);
    setValue('');

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = '24px';
    });
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-[16px] pb-[18px] transition-transform duration-300 ease-out will-change-transform"
      style={{ transform: `translate3d(0, -${keyboardOffset}px, 0)` }}
    >
      <div className="mx-auto w-full max-w-[430px] rounded-[34px] border border-[#eeeeF1] bg-[#f9f9fa] px-[16px] pt-[14px] pb-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder="Ask anything or assign a task"
          onFocus={() => {
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            onFocusChange?.(true);
            syncKeyboardPosition();
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => {
              onFocusChange?.(false);
              updateKeyboardOffset();
            }, 120);
          }}
          onChange={(event) => {
            setValue(event.target.value);
            requestAnimationFrame(resizeTextarea);
            requestAnimationFrame(updateKeyboardOffset);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          className="block h-[24px] max-h-[96px] w-full resize-none overflow-y-auto bg-transparent px-[4px] text-[17px] leading-[24px] tracking-[-0.02em] text-[#202024] outline-none placeholder:text-[#a7a7ad]"
        />

        <div className="mt-[14px] flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <CircleButton>
              <Plus size={22} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <KivoToolsIcon />
            </CircleButton>
          </div>

          <div className="flex items-center gap-[8px]">
            <CircleButton>
              <MessageCircleMore size={20} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
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
  );
}
