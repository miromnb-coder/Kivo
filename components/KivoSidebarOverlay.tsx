'use client';

import Link from 'next/link';
import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  Bookmark,
  Clock3,
  Folder,
  MessageCircle,
  Settings,
  Sparkles,
  UsersRound,
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

function MenuItem({
  icon,
  label,
  active = false,
  href,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const className = `flex h-[46px] w-full items-center gap-[16px] rounded-[24px] px-[13px] text-left text-[15px] font-medium tracking-[-0.03em] text-[#16171a] transition active:scale-[0.99] ${
    active ? 'bg-black/[0.045]' : 'hover:bg-black/[0.03]'
  }`;

  const content = (
    <>
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#15161a]">{icon}</span>
      <span className="flex-1">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onCloseSafe(onClick)} className={className}>
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

function onCloseSafe(callback?: () => void) {
  return () => callback?.();
}

export function KivoSidebarOverlay({ open, onClose, onNewChat }: KivoSidebarOverlayProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const dragModeRef = useRef<DragMode>('idle');

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

      if (deltaX < -18 && absX > absY * 1.45) {
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
    const shouldClose = dragModeRef.current === 'horizontal' && (deltaX < -86 || velocity < -0.72);

    setIsDragging(false);
    dragModeRef.current = 'idle';

    if (shouldClose) {
      setDragX(-300);
      window.setTimeout(() => {
        setDragX(0);
        onClose();
      }, 150);
      return;
    }

    setDragX(0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-transparent"
      />

      <aside
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute left-0 top-[calc(env(safe-area-inset-top)+86px)] flex w-[284px] touch-pan-y select-none flex-col overflow-hidden rounded-r-[31px] bg-white/64 px-[18px] py-[20px] shadow-[20px_24px_72px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.02] backdrop-blur-2xl will-change-transform ${isDragging ? '' : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'}`}
        style={{ transform: `translate3d(${dragX}px,0,0)` }}
      >
        <div className="space-y-[8px]">
          <MenuItem icon={<MessageCircle size={21} strokeWidth={1.9} />} label="New chat" active onClick={() => { onNewChat(); onClose(); }} />
          <MenuItem icon={<Clock3 size={21} strokeWidth={1.9} />} label="History" href="/history" onClick={onClose} />
          <MenuItem icon={<Bookmark size={20} strokeWidth={1.9} />} label="Saved" href="/saved" onClick={onClose} />
          <MenuItem icon={<Folder size={21} strokeWidth={1.9} />} label="Projects" href="/projects" onClick={onClose} />
        </div>

        <div className="my-[14px] h-px bg-black/[0.055]" />

        <div className="space-y-[8px]">
          <MenuItem icon={<UsersRound size={21} strokeWidth={1.9} />} label="Teams" href="/teams" onClick={onClose} />
          <MenuItem icon={<Settings size={21} strokeWidth={1.9} />} label="Settings" href="/settings" onClick={onClose} />
        </div>

        <div className="my-[14px] h-px bg-black/[0.055]" />

        <Link
          href="/upgrade"
          onClick={onClose}
          className="flex h-[70px] items-center gap-[16px] rounded-[24px] px-[13px] text-left transition active:scale-[0.99]"
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#15161a]">
            <Sparkles size={22} strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium tracking-[-0.03em] text-[#16171a]">Upgrade plan</span>
            <span className="mt-[3px] block max-w-[126px] text-[12px] leading-[1.18] tracking-[-0.025em] text-[#7d7f87]">More power, more possibilities.</span>
          </span>
          <span className="text-[27px] font-light leading-none text-[#72747b]">›</span>
        </Link>
      </aside>
    </div>
  );
}
