'use client';

import Link from 'next/link';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  Bot,
  BrainCircuit,
  CalendarDays,
  FileText,
  Home,
  MessageCircle,
  Settings,
  Sparkles,
  SquarePen,
} from 'lucide-react';

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

const DRAWER_CLOSE_TRANSLATE = -430;

const fallbackRecent = [
  { id: 'fallback-weekly-planning', title: 'Weekly planning for Kivo' },
  { id: 'fallback-life-operator', title: 'Ideas for AI Life Operator' },
];

function MenuItem({ icon, label, active = false, href, onClick }: MenuItemProps) {
  const className = `flex h-[52px] w-full items-center gap-[18px] rounded-[25px] px-[18px] text-left text-[16.5px] font-medium tracking-[-0.04em] text-[#151518] transition duration-200 active:scale-[0.99] ${
    active
      ? 'bg-white/86 shadow-[0_10px_28px_rgba(15,23,42,0.035),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-black/[0.018]'
      : 'hover:bg-white/45'
  }`;

  const content = (
    <>
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[#111113]">
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

function RecentItem({ title, active = false, onClick }: { title: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[46px] w-full items-center gap-[15px] rounded-[20px] px-[12px] text-left transition duration-200 active:scale-[0.99] ${
        active ? 'bg-white/74 shadow-[0_8px_22px_rgba(15,23,42,0.03)]' : 'hover:bg-white/48'
      }`}
    >
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[13px] bg-white/72 text-[#151518] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/[0.025]">
        <FileText size={18} strokeWidth={1.85} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium tracking-[-0.035em] text-[#1a1a1d]">
        {title}
      </span>
    </button>
  );
}

export function KivoSidebarOverlay({
  open,
  onClose,
  conversations,
  activeConversationId,
  onNewChat,
  onOpenConversation,
}: KivoSidebarOverlayProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const dragModeRef = useRef<DragMode>('idle');

  const recentItems = conversations.length
    ? conversations.slice(0, 2).map((conversation) => ({ id: conversation.id, title: conversation.title || 'Untitled conversation' }))
    : fallbackRecent;

  function closeWithMotion() {
    setDragX(DRAWER_CLOSE_TRANSLATE);
    window.setTimeout(() => {
      setDragX(0);
      onClose();
    }, 155);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartTimeRef.current = Date.now();
    dragModeRef.current = 'idle';
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (dragModeRef.current === 'idle') {
      if (absY > 10 && absY > absX * 1.15) {
        dragModeRef.current = 'vertical';
        setDragX(0);
        return;
      }

      if (deltaX < -16 && absX > absY * 1.35) {
        dragModeRef.current = 'horizontal';
      }
    }

    if (dragModeRef.current !== 'horizontal') return;

    event.preventDefault();
    setDragX(Math.min(0, deltaX));
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStartXRef.current;
    const elapsed = Math.max(1, Date.now() - dragStartTimeRef.current);
    const velocity = deltaX / elapsed;
    const shouldClose = dragModeRef.current === 'horizontal' && (deltaX < -76 || velocity < -0.68);

    setIsDragging(false);
    dragModeRef.current = 'idle';

    if (shouldClose) {
      closeWithMotion();
      return;
    }

    setDragX(0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={closeWithMotion}
        className="absolute inset-y-0 right-0 left-[86vw] bg-transparent"
      />

      <aside
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-y-0 left-0 flex w-[86vw] max-w-[370px] touch-pan-y select-none flex-col overflow-hidden border-r border-black/[0.035] bg-[#f3f3f5]/98 shadow-[12px_0_42px_rgba(15,23,42,0.045)] backdrop-blur-2xl will-change-transform ${
          isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
        }`}
        style={{ transform: `translate3d(${dragX}px,0,0)` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.45)_0%,rgba(243,243,245,0)_32%)]" />

        <div className="relative flex h-full min-h-0 flex-col">
          <header className="flex h-[calc(env(safe-area-inset-top)+62px)] shrink-0 items-end px-[24px] pb-[12px]">
            <div className="flex items-center gap-[12px]">
              <Sparkles size={13} strokeWidth={2} className="text-[#7C8CFF]" />
              <span className="text-[30px] font-semibold leading-none tracking-[-0.075em] text-[#111113]">
                Kivo
              </span>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[24px] pb-[18px] pt-[8px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav className="space-y-[7px]" aria-label="Main menu">
              <MenuItem icon={<Home size={25} strokeWidth={1.8} />} label="Home" active href="/" onClick={onClose} />
              <MenuItem icon={<CalendarDays size={25} strokeWidth={1.8} />} label="Today" href="/today" onClick={onClose} />
              <MenuItem icon={<MessageCircle size={25} strokeWidth={1.8} />} label="Conversations" href="/history" onClick={onClose} />
              <MenuItem icon={<Bot size={25} strokeWidth={1.8} />} label="Agents" href="/agents" onClick={onClose} />
              <MenuItem icon={<BrainCircuit size={25} strokeWidth={1.8} />} label="Memory" href="/memory" onClick={onClose} />
              <MenuItem icon={<Settings size={25} strokeWidth={1.8} />} label="Settings" href="/settings" onClick={onClose} />
            </nav>

            <div className="my-[22px] h-px bg-black/[0.065]" />

            <div className="space-y-[10px]">
              <p className="px-[2px] text-[13.5px] font-medium tracking-[-0.025em] text-[#85868d]">
                Recent
              </p>
              <div className="space-y-[6px]">
                {recentItems.map((item) => {
                  const isRealConversation = !item.id.startsWith('fallback-');
                  return (
                    <RecentItem
                      key={item.id}
                      title={item.title}
                      active={activeConversationId === item.id}
                      onClick={isRealConversation ? () => onOpenConversation(item.id) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <footer className="shrink-0 px-[24px] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[12px]">
            <div className="flex items-center justify-between gap-[16px]">
              <button
                type="button"
                className="flex h-[52px] w-[148px] items-center gap-[13px] rounded-[25px] bg-white/78 px-[12px] text-left shadow-[0_10px_26px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] active:scale-[0.99]"
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#c9771b] text-[15px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                  M
                </span>
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium tracking-[-0.04em] text-[#151518]">
                  Miro
                </span>
              </button>

              <button
                type="button"
                aria-label="New chat"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[20px] bg-white/78 text-[#111113] shadow-[0_10px_26px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] transition active:scale-[0.96]"
              >
                <SquarePen size={24} strokeWidth={1.85} />
              </button>
            </div>
          </footer>
        </div>
      </aside>
    </div>
  );
}
