'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircleMore, Mic, Plus } from 'lucide-react';
import { KivoPlusSheet, type ConnectorId } from './KivoPlusSheet';
import { KivoConnectorsSheet } from './KivoConnectorsSheet';
import { KivoModePopover } from './KivoModePopover';
import { KivoVoiceRecorderBar } from './KivoVoiceRecorderBar';
import { KivoAttachmentPreviewTray, type KivoAttachment } from './KivoAttachments';

type KivoComposerProps = {
  onFocusChange?: (focused: boolean) => void;
  onSubmitMessage?: (message: string, attachments: KivoAttachment[]) => Promise<void> | void;
  disabled?: boolean;
  conversationId?: string | null;
  messageCount?: number;
};

type VisualViewportState = {
  height: number;
  offsetTop: number;
};

type SmartSuggestion = {
  label: string;
  prompt: string;
};

const smartSuggestions: SmartSuggestion[] = [
  { label: 'Create image', prompt: 'Create an image of ' },
  { label: 'Find best deal', prompt: 'Find the best deal for ' },
  { label: 'Plan my day', prompt: 'Plan my day and suggest the most important next steps.' },
  { label: 'Summarize email', prompt: 'Summarize my latest important emails and action items.' },
  { label: 'Research deeply', prompt: 'Research this deeply and give me a clear summary: ' },
  { label: 'Write draft', prompt: 'Write a polished draft for ' },
];

const MAX_IMAGE_ATTACHMENTS = 6;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;

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

function KivoSmartSuggestionRail({ visible, onSelect }: { visible: boolean; onSelect: (suggestion: SmartSuggestion) => void }) {
  return (
    <div
      className={`pointer-events-auto mb-[10px] overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? 'max-h-[44px] translate-y-0 opacity-100' : 'max-h-0 translate-y-[8px] opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div className="relative mx-auto w-full max-w-[430px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[18px] bg-gradient-to-r from-[#f7f7f8] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[18px] bg-gradient-to-l from-[#f7f7f8] to-transparent" />
        <div className="flex snap-x snap-mandatory gap-[8px] overflow-x-auto px-[2px] pb-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {smartSuggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="h-[36px] shrink-0 snap-start rounded-full border border-black/[0.055] bg-white/80 px-[16px] text-[15px] font-normal tracking-[-0.035em] text-[#303035] shadow-[0_8px_22px_rgba(15,23,42,0.035)] backdrop-blur transition active:scale-[0.98]"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function readImageAttachment(file: File): Promise<KivoAttachment | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null);
  if (file.size > MAX_IMAGE_SIZE_BYTES) return Promise.resolve(null);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : '';
      if (!url) {
        resolve(null);
        return;
      }

      resolve({
        id: crypto.randomUUID(),
        type: 'image',
        name: file.name || 'image',
        size: file.size,
        mimeType: file.type,
        url,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function connectorFromUrlParams(params: URLSearchParams): ConnectorId | null {
  const connector = params.get('connector') || params.get('connectorId');
  if (
    connector === 'google-drive' ||
    connector === 'gmail' ||
    connector === 'google-calendar' ||
    connector === 'outlook-calendar' ||
    connector === 'outlook-mail'
  ) {
    return connector;
  }

  const connected = params.get('connected');
  if (connected === 'drive' || connected === 'google-drive') return 'google-drive';
  if (connected === 'gmail') return 'gmail';
  if (connected === 'calendar' || connected === 'google-calendar') return 'google-calendar';
  if (connected === 'outlook-calendar') return 'outlook-calendar';
  if (connected === 'outlook-mail') return 'outlook-mail';

  if (params.has('drive')) return 'google-drive';
  if (params.has('gmail')) return 'gmail';
  if (params.has('calendar')) return 'google-calendar';
  if (params.has('outlook-calendar')) return 'outlook-calendar';
  if (params.has('outlook-mail') || params.has('outlook')) return 'outlook-mail';

  return null;
}

function removeConnectorUrlParams() {
  const url = new URL(window.location.href);
  const keys = ['connected', 'connector', 'connectorId', 'drive', 'gmail', 'calendar', 'outlook', 'outlook-calendar', 'outlook-mail'];
  let changed = false;

  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (changed) {
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }
}

function createAudioFile(audioBlob: Blob) {
  const mimeType = audioBlob.type || 'audio/webm';
  const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'webm';
  return new File([audioBlob], `kivo-voice.${extension}`, { type: mimeType });
}

export function KivoComposer({
  onFocusChange,
  onSubmitMessage,
  disabled = false,
  conversationId = null,
  messageCount = 0,
}: KivoComposerProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<KivoAttachment[]>([]);
  const [hasSubmittedInCurrentConversation, setHasSubmittedInCurrentConversation] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isConnectorsOpen, setIsConnectorsOpen] = useState(false);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [pendingConnectorId, setPendingConnectorId] = useState<ConnectorId | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [visualViewportState, setVisualViewportState] = useState<VisualViewportState>({
    height: 0,
    offsetTop: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousConversationKeyRef = useRef<string | null>(conversationId ?? null);
  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled && !isTranscribing;
  const conversationHasMessages = messageCount > 0;
  const showSmartSuggestions =
    !conversationHasMessages &&
    !hasSubmittedInCurrentConversation &&
    value.trim().length === 0 &&
    attachments.length === 0 &&
    !isPlusOpen &&
    !isConnectorsOpen &&
    !isModeOpen &&
    !isRecording;

  useEffect(() => {
    const connectorId = connectorFromUrlParams(new URLSearchParams(window.location.search));
    if (!connectorId) return;

    setPendingConnectorId(connectorId);
    setIsConnectorsOpen(false);
    setIsModeOpen(false);
    setIsPlusOpen(true);
    window.setTimeout(removeConnectorUrlParams, 350);
  }, []);

  useEffect(() => {
    const nextConversationKey = conversationId ?? null;
    if (previousConversationKeyRef.current !== nextConversationKey) {
      previousConversationKeyRef.current = nextConversationKey;
      setHasSubmittedInCurrentConversation(false);
      setValue('');
      setAttachments([]);
      setIsRecording(false);
      setIsTranscribing(false);
      setRecordSeconds(0);
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = '24px';
      });
    }
  }, [conversationId]);

  useEffect(() => {
    if (messageCount === 0) {
      setHasSubmittedInCurrentConversation(false);
    }
  }, [messageCount]);

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

  function openImagePicker() {
    setIsPlusOpen(false);
    imageInputRef.current?.click();
  }

  async function handleImageInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    const remainingSlots = Math.max(0, MAX_IMAGE_ATTACHMENTS - attachments.length);
    if (remainingSlots === 0) return;

    const nextAttachments = (await Promise.all(files.slice(0, remainingSlots).map(readImageAttachment))).filter(Boolean) as KivoAttachment[];
    if (!nextAttachments.length) return;

    setAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_IMAGE_ATTACHMENTS));
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      syncKeyboardPosition();
    });
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  function handleSubmit() {
    const message = value.trim();
    const outgoingAttachments = attachments;
    if ((!message && outgoingAttachments.length === 0) || disabled || isTranscribing) return;

    setHasSubmittedInCurrentConversation(true);
    setValue('');
    setAttachments([]);
    onSubmitMessage?.(message, outgoingAttachments);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = '24px';
    });
  }

  function handleSuggestionSelect(suggestion: SmartSuggestion) {
    setValue(suggestion.prompt);
    requestAnimationFrame(() => {
      resizeTextarea();
      textareaRef.current?.focus();
      const length = suggestion.prompt.length;
      textareaRef.current?.setSelectionRange(length, length);
      syncKeyboardPosition();
    });
  }

  function startRecording() {
    setIsPlusOpen(false);
    setIsConnectorsOpen(false);
    setIsModeOpen(false);
    setRecordSeconds(0);
    setIsRecording(true);
    setIsTranscribing(false);
    onFocusChange?.(false);
  }

  function cancelRecording() {
    setIsRecording(false);
    setIsTranscribing(false);
    setRecordSeconds(0);
  }

  async function transcribeRecording(audioBlob?: Blob) {
    if (!audioBlob || audioBlob.size === 0) {
      cancelRecording();
      return;
    }

    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', createAudioFile(audioBlob));

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Transcription failed.');
      }

      const transcript = typeof payload.text === 'string' ? payload.text.trim() : '';
      if (transcript) {
        setValue((current) => {
          const prefix = current.trim().length ? `${current.trim()} ` : '';
          return `${prefix}${transcript}`;
        });
        requestAnimationFrame(() => {
          resizeTextarea();
          textareaRef.current?.focus();
          syncKeyboardPosition();
        });
      }
    } catch (error) {
      console.warn('Voice transcription failed', error);
    } finally {
      setIsRecording(false);
      setIsTranscribing(false);
      setRecordSeconds(0);
    }
  }

  const viewportHeight = visualViewportState.height || window.innerHeight;
  const keyboardOffset = Math.max(0, window.innerHeight - viewportHeight - visualViewportState.offsetTop);

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageInputChange}
      />

      {!isRecording ? (
        <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none px-[16px] pb-[64px] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform" style={{ transform: `translate3d(0, -${keyboardOffset}px, 0)` }}>
          <KivoSmartSuggestionRail visible={showSmartSuggestions} onSelect={handleSuggestionSelect} />

          <div className="mx-auto w-full max-w-[430px] rounded-[34px] border border-[#eeeeF1] bg-[#f9f9fa] px-[16px] pt-[14px] pb-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] pointer-events-auto">
            <KivoAttachmentPreviewTray attachments={attachments} onRemove={removeAttachment} />

            <textarea
              ref={textareaRef}
              value={value}
              rows={1}
              placeholder="Ask anything or assign a task"
              disabled={disabled || isTranscribing}
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

      <KivoVoiceRecorderBar open={isRecording} seconds={recordSeconds} transcribing={isTranscribing} onCancel={cancelRecording} onConfirm={(audioBlob) => { void transcribeRecording(audioBlob); }} />
      <KivoPlusSheet
        open={isPlusOpen}
        onClose={() => setIsPlusOpen(false)}
        onAddFiles={openImagePicker}
        initialConnectorId={pendingConnectorId}
        onInitialConnectorHandled={() => setPendingConnectorId(null)}
      />
      <KivoConnectorsSheet open={isConnectorsOpen} onClose={() => setIsConnectorsOpen(false)} />
      <KivoModePopover open={isModeOpen} onClose={() => setIsModeOpen(false)} />
    </>
  );
}
