'use client';

import { useMemo, type ReactNode } from 'react';
import {
  Bell,
  Bot,
  FlaskConical,
  Folder,
  FolderPlus,
  Gift,
  Home,
  MessageCircle,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
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
};

function SidebarItem({ icon, label, badge }: { icon: ReactNode; label: string; badge?: string }) {
  return (
    <button type="button" className="flex h-[40px] w-full items-center gap-[18px] rounded-[14px] px-[6px] text-left text-[17px] tracking-[-0.025em] text-[#17181b] active:scale-[0.99]">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[#6d6e74]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#efeff1] px-[9px] text-[16px] text-[#1f2023]">{badge}</span> : null}
    </button>
  );
}

function BottomNavItem({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <button type="button" className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-[11px] tracking-[-0.02em] ${active ? 'text-[#111114]' : 'text-[#606168]'}`}>
      <span className="flex h-[28px] items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function KivoSidebarOverlay({
  open,
  onClose,
  conversations,
  activeConversationId,
  filter,
  query,
  onFilterChange,
  onQueryChange,
  onNewChat,
  onOpenConversation,
}: KivoSidebarOverlayProps) {
  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations
      .filter((conversation) => {
        if (filter === 'favorites' && !conversation.is_favorite) return false;
        if (filter === 'scheduled' && conversation.status !== 'scheduled') return false;
        if (!normalizedQuery) return true;
        return conversation.title.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 40);
  }, [conversations, filter, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/22 backdrop-blur-[7px]" />

      <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-[390px] flex-col overflow-hidden rounded-r-[30px] bg-white/92 shadow-[22px_0_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
        <div className="flex shrink-0 items-center justify-between px-[22px] pt-[calc(env(safe-area-inset-top)+22px)]">
          <div className="flex items-center gap-[13px]">
            <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[14px] bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.1)]">
              <Sparkles size={25} fill="white" strokeWidth={2.3} />
            </div>
            <span className="text-[25px] font-semibold leading-none tracking-[-0.055em] text-[#111114]">Kivo</span>
          </div>

          <div className="flex items-center gap-[18px]">
            <div className="flex h-[38px] items-center gap-[8px] rounded-full bg-white/85 px-[16px] text-[16px] font-medium tracking-[-0.025em] text-[#202024] shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.035]">
              <Sparkles size={16} strokeWidth={2.2} />
              <span>226</span>
            </div>
            <button type="button" onClick={onClose} aria-label="Close menu" className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white/80 text-[#111114] shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] active:scale-[0.96]">
              <X size={24} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="mt-[22px] px-[22px]">
          <label className="flex h-[54px] items-center gap-[14px] rounded-[18px] bg-white/88 px-[16px] text-[17px] tracking-[-0.025em] text-[#8e9097] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035]">
            <Search size={25} strokeWidth={2.1} className="shrink-0 text-[#202024]" />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-[17px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#8e9097]" />
          </label>
        </div>

        <div className="mt-[14px] px-[22px]">
          <button type="button" onClick={onNewChat} className="flex h-[54px] w-full items-center rounded-[18px] bg-white/88 px-[18px] text-left text-[17px] tracking-[-0.025em] text-[#111114] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035] active:scale-[0.99]">
            <span className="mr-[16px] text-[29px] font-light leading-none">+</span>
            <span className="flex-1">New chat</span>
            <span className="mr-[5px] rounded-[9px] bg-[#eeeef1] px-[8px] py-[5px] text-[14px] text-[#606168]">⌘</span>
            <span className="rounded-[9px] bg-[#eeeef1] px-[8px] py-[5px] text-[14px] text-[#606168]">K</span>
          </button>
        </div>

        <div className="mt-[14px] flex shrink-0 gap-[8px] px-[22px]">
          {(['all', 'favorites', 'scheduled'] as SidebarFilter[]).map((item) => (
            <button key={item} type="button" onClick={() => onFilterChange(item)} className={`h-[36px] rounded-full px-[18px] text-[15px] capitalize ${filter === item ? 'bg-black text-white' : 'bg-white/55 text-[#77787f] ring-1 ring-black/[0.06]'}`}>{item}</button>
          ))}
        </div>

        <div className="mx-[22px] mt-[20px] h-px shrink-0 bg-black/[0.07]" />

        <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pb-[12px] pt-[16px]">
          <div className="space-y-[8px]">
            <SidebarItem icon={<MessageCircle size={24} strokeWidth={1.9} />} label="Chat" />
            <SidebarItem icon={<Bot size={24} strokeWidth={1.9} />} label="Agents" />
            <SidebarItem icon={<SlidersHorizontal size={24} strokeWidth={1.9} />} label="Tools" />
            <SidebarItem icon={<Bell size={25} strokeWidth={1.9} />} label="Notifications" badge="3" />
          </div>

          <div className="mt-[18px] h-px bg-black/[0.07]" />

          <section className="mt-[16px]">
            <h3 className="mb-[10px] text-[13px] font-semibold uppercase tracking-[0.09em] text-[#8b8c92]">Projects</h3>
            <div className="space-y-[4px]">
              <SidebarItem icon={<FolderPlus size={23} strokeWidth={1.85} />} label="New project" />
              <button type="button" className="flex h-[44px] w-full items-center gap-[18px] rounded-[13px] bg-black/[0.045] px-[6px] text-left text-[16px] tracking-[-0.025em] text-[#17181b]">
                <span className="flex h-[26px] w-[26px] items-center justify-center text-[#56575d]"><Folder size={24} strokeWidth={1.85} /></span>
                <span>Kivo new</span>
              </button>
              <SidebarItem icon={<Folder size={23} strokeWidth={1.85} />} label="Kivo" />
            </div>
          </section>

          <div className="mt-[16px] h-px bg-black/[0.07]" />

          <section className="mt-[16px]">
            <h3 className="mb-[10px] text-[13px] font-semibold uppercase tracking-[0.09em] text-[#8b8c92]">Recent conversations</h3>
            {visibleConversations.length ? (
              <div className="space-y-[7px]">
                {visibleConversations.map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  return (
                    <button key={conversation.id} type="button" onClick={() => onOpenConversation(conversation.id)} className={`flex h-[32px] w-full items-center gap-[14px] rounded-[10px] px-[4px] text-left text-[14px] tracking-[-0.025em] ${active ? 'bg-black/[0.045] text-[#111114]' : 'text-[#17181b]'}`}>
                      <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[#707177]"><MessageCircle size={16} strokeWidth={1.8} /></span>
                      <span className="truncate">{conversation.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] bg-black/[0.035] px-[14px] py-[12px] text-[14px] tracking-[-0.02em] text-[#77787f]">{query.trim() ? 'No conversations found.' : 'No conversations yet. Start a new chat.'}</div>
            )}
          </section>
        </div>

        <div className="shrink-0 px-[22px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button type="button" className="flex h-[62px] w-full items-center gap-[14px] rounded-[18px] bg-white/80 px-[18px] text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.045] active:scale-[0.99]">
            <span className="flex h-[34px] w-[34px] items-center justify-center text-[#111114]"><Gift size={25} strokeWidth={1.9} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-medium tracking-[-0.025em] text-[#111114]">Invite friends to Kivo</span><span className="block truncate text-[13px] tracking-[-0.02em] text-[#8d8e95]">Get 500 credits each</span></span>
            <span className="text-[26px] font-light text-[#77787f]">›</span>
          </button>

          <div className="mt-[12px] flex h-[52px] items-center justify-between px-[8px]">
            <BottomNavItem active icon={<Home size={27} strokeWidth={1.9} />} label="Home" />
            <BottomNavItem icon={<MessageCircle size={25} strokeWidth={1.9} />} label="Messages" />
            <BottomNavItem icon={<Wrench size={24} strokeWidth={1.9} />} label="Discover" />
            <BottomNavItem icon={<FlaskConical size={25} strokeWidth={1.9} />} label="Labs" />
            <BottomNavItem icon={<Settings2 size={26} strokeWidth={1.9} />} label="Settings" />
          </div>
        </div>
      </aside>
    </div>
  );
}
