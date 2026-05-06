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
  const className = `flex h-[58px] w-full items-center gap-[22px] rounded-[25px] px-[20px] text-left text-[18px] font-medium tracking-[-0.04em] text-[#151518] transition duration-200 active:scale-[0.99] ${
    active
      ? 'bg-white/86 shadow-[0_12px_34px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-black/[0.018]'
      : 'hover:bg-white/45'
  }`;

  const content = (
    <>
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center text-[#111113]">
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
      className={`flex h-[50px] w-full items-center gap-[18px] rounded-[22px] px-[18px] text-left transition duration-200 active:scale-[0.99] ${
        active ? 'bg-white/74 shadow-[0_10px_26px_rgba(15,23,42,0.035)]' : 'hover:bg-white/48'
      }`}
    >
      <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[14px] bg-white/72 text-[#151518] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-black/[0.025]">
        <FileText size={20} strokeWidth={1.85} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15.5px] font-medium tracking-[-0.035em] text-[#1a1a1d]">
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
        className={`absolute inset-y-0 left-0 flex w-[86vw] max-w-[370px] touch-pan-y select-none flex-col overflow-hidden rounded-r-[42px] bg-[#f3f3f5]/98 px-[30px] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+78px)] shadow-[18px_0_54px_rgba(15,23,42,0.075)] ring-1 ring-black/[0.035] backdrop-blur-2xl will-change-transform ${
          isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
        }`}
        style={{ transform: `translate3d(${dragX}px,0,0)` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_46%_18%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.42)_32%,rgba(243,243,245,0)_72%)]" />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="mb-[30px] flex items-center gap-[16px] pl-[2px]">
            <Sparkles size={16} strokeWidth={2} className="text-[#7C8CFF]" />
            <span className="text-[42px] font-semibold leading-none tracking-[-0.075em] text-[#111113]">
              Kivo
            </span>
          </div>

          <nav className="space-y-[8px]" aria-label="Main menu">
            <MenuItem icon={<Home size={29} strokeWidth={1.8} />} label="Home" active href="/" onClick={onClose} />
            <MenuItem icon={<CalendarDays size={28} strokeWidth={1.8} />} label="Today" href="/today" onClick={onClose} />
            <MenuItem icon={<MessageCircle size={28} strokeWidth={1.8} />} label="Conversations" href="/history" onClick={onClose} />
            <MenuItem icon={<Bot size={28} strokeWidth={1.8} />} label="Agents" href="/agents" onClick={onClose} />
            <MenuItem icon={<BrainCircuit size={28} strokeWidth={1.8} />} label="Memory" href="/memory" onClick={onClose} />
            <MenuItem icon={<Settings size={28} strokeWidth={1.8} />} label="Settings" href="/settings" onClick={onClose} />
          </nav>

          <div className="my-[26px] h-px bg-black/[0.075]" />

          <div className="space-y-[12px]">
            <p className="px-[2px] text-[14px] font-medium tracking-[-0.025em] text-[#85868d]">
              Recent
            </p>
            <div className="space-y-[8px]">
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

          <div className="mt-auto flex items-center justify-between gap-[18px] pt-[26px]">
            <button
              type="button"
              className="flex h-[58px] min-w-0 flex-1 items-center gap-[16px] rounded-[25px] bg-white/78 px-[15px] text-left shadow-[0_12px_30px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02] active:scale-[0.99]"
            >
              <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#c9771b] text-[17px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                M
              </span>
              <span className="min-w-0 flex-1 truncate text-[18px] font-medium tracking-[-0.04em] text-[#151518]">
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
              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[22px] bg-white/78 text-[#111113] shadow-[0_12px_30px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02] transition active:scale-[0.96]"
            >
              <SquarePen size={27} strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
