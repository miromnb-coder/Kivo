'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { CalendarDays, FileText, Home, SquarePen, Trash2, PencilLine } from 'lucide-react';

export type SidebarFilter = 'all' | 'favorites' | 'scheduled';

export type KivoConversation = {
  id: string;
  title: string;
  updated_at: string;
  is_favorite?: boolean | null;
  status?: string | null;
};

type KivoSidebarOverlayProps = {
  open: boolean;
  onClose: () => void;
  conversations: KivoConversation[];
  activeConversationId: string | null;
  filter: SidebarFilter;
  query: string;
  onFilterChange: (filter: SidebarFilter) => void;
  onQueryChange: (query: string) => void;
  onNewChat: () => void;
  onOpenConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onDeleteConversation: (conversationId: string) => void;
};

type DragMode = 'idle' | 'horizontal' | 'vertical';

type MenuItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
};

type RecentItemProps = {
  title: string;
  active?: boolean;
  onClick?: () => void;
  onLongPress?: () => void;
};

const DRAWER_CLOSE_TRANSLATE = -430;
const DRAWER_ANIMATION_MS = 320;
const LONG_PRESS_MS = 440;

const fallbackRecent = [
  { id: 'fallback-weekly-planning', title: 'Weekly planning for Kivo' },
  { id: 'fallback-news', title: 'Find today’s news' },
  { id: 'fallback-product', title: 'Kivo product ideas' },
  { id: 'fallback-agent', title: 'Personal AI agent plan' },
  { id: 'fallback-ui', title: 'Interface improvements' },
  { id: 'fallback-memory', title: 'Memory system notes' },
];

function triggerKivoHaptic(kind: 'open' | 'close' | 'action') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  try {
    navigator.vibrate(kind === 'open' ? [10, 18, 10] : kind === 'action' ? 12 : 14);
  } catch {
    // Some browsers expose navigator.vibrate but block it. Ignore safely.
  }
}

function MenuItem({ icon, label, active = false, href, onClick }: MenuItemProps) {
  const className = `flex h-[56px] w-full items-center gap-[20px] rounded-[0px] px-[8px] text-left text-[19px] font-medium tracking-[-0.035em] text-[#1b1c20] transition active:scale-[0.99] ${
    active ? 'bg-transparent' : 'hover:bg-white/32'
  }`;

  const content = (
    <>
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center text-[#222329]">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function RecentItem({ title, active = false, onClick, onLongPress }: RecentItemProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  function clearLongPressTimer() {
    if (longPressTimerRef.current === null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!onLongPress) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      longPressTriggeredRef.current = true;
      triggerKivoHaptic('action');
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!onLongPress || longPressTimerRef.current === null) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const isOutside = event.clientX < rect.left - 10 || event.clientX > rect.right + 10 || event.clientY < rect.top - 10 || event.clientY > rect.bottom + 10;
    if (isOutside) clearLongPressTimer();
  }

  function handlePointerUp() {
    clearLongPressTimer();
  }

  function handleClick() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    onClick?.();
  }

  useEffect(() => clearLongPressTimer, []);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(event) => event.preventDefault()}
      onClick={handleClick}
      className={`block min-h-[48px] w-full rounded-[14px] px-[4px] py-[12px] text-left transition active:scale-[0.995] ${
        active ? 'bg-white/46' : 'hover:bg-white/34'
      }`}
    >
      <span className="block truncate text-[16px] font-normal leading-[1.2] tracking-[-0.025em] text-[#2b2c31]">
        {title}
      </span>
    </button>
  );
}

function ConversationActionSheet({
  conversation,
  onClose,
  onRename,
  onDelete,
}: {
  conversation: KivoConversation;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/[0.06] px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] backdrop-blur-[1px]">
      <button type="button" aria-label="Close conversation menu" onClick={onClose} className="absolute inset-0" />

      <div className="relative z-10 w-full overflow-hidden rounded-[28px] bg-[#fbfbfc]/96 p-[8px] shadow-[0_22px_70px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.05] backdrop-blur-2xl">
        <div className="px-[16px] pb-[8px] pt-[12px]">
          <p className="truncate text-[14px] font-medium tracking-[-0.02em] text-[#777982]">
            {conversation.title || 'Untitled conversation'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRename}
          className="flex h-[54px] w-full items-center gap-[14px] rounded-[20px] px-[16px] text-left text-[17px] font-medium tracking-[-0.035em] text-[#17181b] transition active:scale-[0.99] active:bg-black/[0.035]"
        >
          <PencilLine size={20} strokeWidth={1.9} />
          Rename
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-[54px] w-full items-center gap-[14px] rounded-[20px] px-[16px] text-left text-[17px] font-medium tracking-[-0.035em] text-[#d33a32] transition active:scale-[0.99] active:bg-[#d33a32]/[0.06]"
        >
          <Trash2 size={20} strokeWidth={1.9} />
          Delete conversation
        </button>

        <div className="my-[6px] h-px bg-black/[0.06]" />

        <button
          type="button"
          onClick={onClose}
          className="flex h-[54px] w-full items-center justify-center rounded-[20px] text-[17px] font-medium tracking-[-0.035em] text-[#17181b] transition active:scale-[0.99] active:bg-black/[0.035]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function KivoSidebarOverlay({
  open,
  onClose,
  conversations,
  activeConversationId,
  onNewChat,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
}: KivoSidebarOverlayProps) {
  const [dragX, setDragX] = useState(DRAWER_CLOSE_TRANSLATE);
  const [isDragging, setIsDragging] = useState(false);
  const [isPresent, setIsPresent] = useState(open);
  const [actionConversation, setActionConversation] = useState<KivoConversation | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const dragModeRef = useRef<DragMode>('idle');
  const closeTimerRef = useRef<number | null>(null);

  const recentItems = conversations.length
    ? conversations.slice(0, 12).map((conversation) => ({ ...conversation, title: conversation.title || 'Untitled conversation' }))
    : fallbackRecent.map((item) => ({ ...item, updated_at: '', is_favorite: null, status: null }));

  useEffect(() => {
    if (!isPresent && !open) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
    };
  }, [isPresent, open]);

  useEffect(() => {
    if (!open) return;

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsPresent(true);
    setIsDragging(false);
    setActionConversation(null);
    dragModeRef.current = 'idle';
    setDragX(DRAWER_CLOSE_TRANSLATE);
    triggerKivoHaptic('open');

    const frame = window.requestAnimationFrame(() => {
      setDragX(0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (open || !isPresent) return;

    setIsDragging(false);
    setActionConversation(null);
    dragModeRef.current = 'idle';
    setDragX(DRAWER_CLOSE_TRANSLATE);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsPresent(false);
    }, DRAWER_ANIMATION_MS);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, isPresent]);

  function closeWithMotion() {
    if (!open || closeTimerRef.current !== null) return;

    triggerKivoHaptic('close');
    setIsDragging(false);
    setActionConversation(null);
    dragModeRef.current = 'idle';
    setDragX(DRAWER_CLOSE_TRANSLATE);
    onClose();
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (actionConversation || closeTimerRef.current !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartTimeRef.current = Date.now();
    dragModeRef.current = 'idle';
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (actionConversation || !isDragging || closeTimerRef.current !== null) return;

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (dragModeRef.current === 'idle') {
      if (absY > 10 && absY > absX * 1.12) {
        dragModeRef.current = 'vertical';
        setDragX(0);
        return;
      }

      if (deltaX < -14 && absX > absY * 1.28) {
        dragModeRef.current = 'horizontal';
      }
    }

    if (dragModeRef.current !== 'horizontal') return;

    event.preventDefault();
    setDragX(Math.min(0, deltaX));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (actionConversation || !isDragging || closeTimerRef.current !== null) return;

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const elapsed = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = deltaX / elapsed;
    const shouldClose = dragModeRef.current === 'horizontal' && absX > absY * 1.18 && (deltaX < -72 || velocity < -0.62);

    setIsDragging(false);
    dragModeRef.current = 'idle';

    if (shouldClose) {
      closeWithMotion();
      return;
    }

    setDragX(0);
  }

  function openConversationAndClose(conversationId: string) {
    triggerKivoHaptic('close');
    onOpenConversation(conversationId);
  }

  function startNewChatAndClose() {
    triggerKivoHaptic('close');
    onNewChat();
  }

  function renameActionConversation() {
    if (!actionConversation) return;

    const nextTitle = window.prompt('Rename conversation', actionConversation.title || 'Untitled conversation')?.trim();
    if (!nextTitle || nextTitle === actionConversation.title) {
      setActionConversation(null);
      return;
    }

    onRenameConversation(actionConversation.id, nextTitle);
    setActionConversation(null);
  }

  function deleteActionConversation() {
    if (!actionConversation) return;

    const confirmed = window.confirm(`Delete “${actionConversation.title || 'Untitled conversation'}”?`);
    if (!confirmed) return;

    onDeleteConversation(actionConversation.id);
    setActionConversation(null);
  }

  if (!isPresent && !open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden overscroll-none"
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={handlePointerUp}
      onPointerCancelCapture={handlePointerUp}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeWithMotion}
        onTouchMove={(event) => event.preventDefault()}
        className="absolute inset-y-0 right-0 left-[86vw] bg-transparent touch-pan-y"
      />

      <aside
        className={`absolute inset-y-0 left-0 flex w-[86vw] max-w-[370px] touch-pan-y select-none flex-col overflow-hidden border-r border-black/[0.035] bg-[#f3f3f5]/98 shadow-[12px_0_42px_rgba(15,23,42,0.04)] backdrop-blur-2xl will-change-transform ${
          isDragging ? '' : 'transition-transform duration-[320ms] ease-[cubic-bezier(0.19,1,0.22,1)]'
        }`}
        style={{ transform: `translate3d(${dragX}px,0,0)` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.36)_0%,rgba(243,243,245,0)_34%)]" />

        <div className="relative flex h-full min-h-0 flex-col">
          <header className="flex h-[calc(env(safe-area-inset-top)+56px)] shrink-0 items-end px-[36px] pb-[7px]">
            <h2 className="text-[30px] font-semibold leading-none tracking-[-0.06em] text-[#111113]">
              Kivo
            </h2>
          </header>

          <div
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-[36px] pb-[22px] pt-[32px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <nav className="space-y-[18px]" aria-label="Main menu">
              <MenuItem icon={<Home size={28} strokeWidth={1.75} />} label="Home" active href="/" onClick={closeWithMotion} />
              <MenuItem icon={<CalendarDays size={28} strokeWidth={1.75} />} label="Today" href="/today" onClick={closeWithMotion} />
              <MenuItem icon={<FileText size={28} strokeWidth={1.75} />} label="Library" href="/history" onClick={closeWithMotion} />
            </nav>

            <div className="my-[34px] h-px bg-black/[0.08]" />

            <div className="space-y-[6px]">
              {recentItems.map((item) => {
                const isRealConversation = !item.id.startsWith('fallback-');
                return (
                  <RecentItem
                    key={item.id}
                    title={item.title}
                    active={activeConversationId === item.id}
                    onClick={isRealConversation ? () => openConversationAndClose(item.id) : undefined}
                    onLongPress={isRealConversation ? () => setActionConversation(item as KivoConversation) : undefined}
                  />
                );
              })}
            </div>
          </div>

          <footer className="shrink-0 px-[36px] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[12px]">
            <div className="flex items-center justify-between gap-[16px]">
              <button
                type="button"
                className="flex h-[50px] w-[138px] items-center gap-[12px] rounded-[25px] bg-white/78 px-[11px] text-left shadow-[0_10px_26px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.018] active:scale-[0.99]"
              >
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#c9771b] text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  M
                </span>
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium tracking-[-0.04em] text-[#151518]">
                  Miro
                </span>
              </button>

              <button
                type="button"
                aria-label="New chat"
                onClick={startNewChatAndClose}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[20px] bg-white/78 text-[#111113] shadow-[0_10px_26px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.018] transition active:scale-[0.96]"
              >
                <SquarePen size={24} strokeWidth={1.85} />
              </button>
            </div>
          </footer>
        </div>
      </aside>

      {actionConversation ? (
        <ConversationActionSheet
          conversation={actionConversation}
          onClose={() => setActionConversation(null)}
          onRename={renameActionConversation}
          onDelete={deleteActionConversation}
        />
      ) : null}
    </div>
  );
}
