'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Bell,
  Bot,
  FlaskConical,
  Folder,
  FolderPlus,
  Gift,
  Home,
  MessageCircle,
  MoreHorizontal,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wrench,
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

function SidebarItem({ icon, label, badge }: { icon: ReactNode; label: string; badge?: string }) {
  return (
    <button type="button" className="flex h-[39px] w-full items-center gap-[18px] rounded-[14px] px-[6px] text-left text-[16px] tracking-[-0.025em] text-[#17181b] active:scale-[0.99]">
      <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center text-[#6d6e74]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="flex h-[29px] min-w-[29px] items-center justify-center rounded-full bg-[#efeff1] px-[9px] text-[15px] text-[#1f2023]">{badge}</span> : null}
    </button>
  );
}

function BottomNavItem({ icon, label, active = false }: { icon: ReactNode; label: string; active?: boolean }) {
  return (
    <button type="button" className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[2px] text-[10.5px] tracking-[-0.02em] ${active ? 'text-[#111114]' : 'text-[#606168]'}`}>
      <span className="flex h-[25px] items-center justify-center">{icon}</span>
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
  onRenameConversation,
  onDeleteConversation,
}: KivoSidebarOverlayProps) {
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [renamingConversation, setRenamingConversation] = useState<KivoConversation | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingConversation, setDeletingConversation] = useState<KivoConversation | null>(null);

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

  function openRename(conversation: KivoConversation) {
    setMenuConversationId(null);
    setRenamingConversation(conversation);
    setRenameValue(conversation.title);
  }

  function submitRename() {
    const title = renameValue.trim();
    if (!renamingConversation || !title) return;
    onRenameConversation(renamingConversation.id, title);
    setRenamingConversation(null);
    setRenameValue('');
  }

  function openDelete(conversation: KivoConversation) {
    setMenuConversationId(null);
    setDeletingConversation(conversation);
  }

  function confirmDelete() {
    if (!deletingConversation) return;
    onDeleteConversation(deletingConversation.id);
    setDeletingConversation(null);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/22 backdrop-blur-[7px]" />

      <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-[390px] flex-col overflow-hidden rounded-r-[30px] bg-white/92 shadow-[22px_0_70px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
        <div className="flex shrink-0 items-center justify-between px-[28px] pt-[calc(env(safe-area-inset-top)+44px)]">
          <span className="text-[24px] font-semibold leading-none tracking-[-0.055em] text-[#111114]">Kivo</span>

          <div className="flex h-[36px] items-center gap-[8px] rounded-full bg-white/85 px-[16px] text-[15.5px] font-semibold tracking-[-0.025em] text-[#202024] shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
            <Sparkles size={15} strokeWidth={2.2} />
            <span>226</span>
          </div>
        </div>

        <div className="mt-[26px] px-[28px]">
          <label className="flex h-[50px] items-center gap-[13px] rounded-[16px] bg-white/88 px-[14px] text-[16px] tracking-[-0.025em] text-[#8e9097] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035]">
            <Search size={23} strokeWidth={2.1} className="shrink-0 text-[#202024]" />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-[16px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#8e9097]" />
          </label>
        </div>

        <div className="mt-[14px] px-[28px]">
          <button type="button" onClick={onNewChat} className="flex h-[50px] w-full items-center rounded-[16px] bg-white/88 px-[16px] text-left text-[16px] tracking-[-0.025em] text-[#111114] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035] active:scale-[0.99]">
            <span className="mr-[15px] text-[27px] font-light leading-none">+</span>
            <span className="flex-1">New chat</span>
            <span className="mr-[5px] rounded-[9px] bg-[#eeeef1] px-[8px] py-[4px] text-[13px] text-[#606168]">⌘</span>
            <span className="rounded-[9px] bg-[#eeeef1] px-[8px] py-[4px] text-[13px] text-[#606168]">K</span>
          </button>
        </div>

        <div className="mt-[14px] flex shrink-0 gap-[8px] px-[28px]">
          {(['all', 'favorites', 'scheduled'] as SidebarFilter[]).map((item) => (
            <button key={item} type="button" onClick={() => onFilterChange(item)} className={`h-[34px] rounded-full px-[17px] text-[14px] capitalize ${filter === item ? 'bg-black text-white' : 'bg-white/55 text-[#77787f] ring-1 ring-black/[0.06]'}`}>{item}</button>
          ))}
        </div>

        <div className="mx-[28px] mt-[19px] h-px shrink-0 bg-black/[0.07]" />

        <div className="min-h-0 flex-1 overflow-y-auto px-[28px] pb-[12px] pt-[14px]">
          <div className="space-y-[7px]">
            <SidebarItem icon={<MessageCircle size={23} strokeWidth={1.9} />} label="Chat" />
            <SidebarItem icon={<Bot size={23} strokeWidth={1.9} />} label="Agents" />
            <SidebarItem icon={<SlidersHorizontal size={23} strokeWidth={1.9} />} label="Tools" />
            <SidebarItem icon={<Bell size={24} strokeWidth={1.9} />} label="Notifications" badge="3" />
          </div>

          <div className="mt-[17px] h-px bg-black/[0.07]" />

          <section className="mt-[15px]">
            <h3 className="mb-[9px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b8c92]">Projects</h3>
            <div className="space-y-[4px]">
              <SidebarItem icon={<FolderPlus size={22} strokeWidth={1.85} />} label="New project" />
              <button type="button" className="flex h-[41px] w-full items-center gap-[18px] rounded-[13px] bg-black/[0.045] px-[6px] text-left text-[16px] tracking-[-0.025em] text-[#17181b]">
                <span className="flex h-[25px] w-[25px] items-center justify-center text-[#56575d]"><Folder size={23} strokeWidth={1.85} /></span>
                <span>Kivo new</span>
              </button>
              <SidebarItem icon={<Folder size={22} strokeWidth={1.85} />} label="Kivo" />
            </div>
          </section>

          <div className="mt-[15px] h-px bg-black/[0.07]" />

          <section className="mt-[15px]">
            <h3 className="mb-[9px] text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8b8c92]">Recent conversations</h3>
            {visibleConversations.length ? (
              <div className="space-y-[6px]">
                {visibleConversations.map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  const menuOpen = menuConversationId === conversation.id;
                  return (
                    <div key={conversation.id} className={`relative flex h-[32px] items-center rounded-[10px] px-[4px] ${active ? 'bg-black/[0.045]' : ''}`}>
                      <button type="button" onClick={() => onOpenConversation(conversation.id)} className="flex min-w-0 flex-1 items-center gap-[13px] text-left text-[13.5px] tracking-[-0.025em] text-[#17181b]">
                        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[#707177]"><MessageCircle size={15} strokeWidth={1.8} /></span>
                        <span className="truncate">{conversation.title}</span>
                      </button>
                      <button type="button" aria-label="Conversation options" onClick={() => setMenuConversationId(menuOpen ? null : conversation.id)} className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-[#707177] active:scale-[0.96]">
                        <MoreHorizontal size={17} strokeWidth={2} />
                      </button>
                      {menuOpen ? (
                        <div className="absolute right-[2px] top-[31px] z-20 w-[158px] overflow-hidden rounded-[16px] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.06]">
                          <button type="button" onClick={() => openRename(conversation)} className="flex h-[42px] w-full items-center px-[14px] text-left text-[14px] tracking-[-0.02em] text-[#17181b]">Rename</button>
                          <button type="button" onClick={() => openDelete(conversation)} className="flex h-[42px] w-full items-center gap-[8px] px-[14px] text-left text-[14px] tracking-[-0.02em] text-red-600"><Trash2 size={15} />Delete</button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[16px] bg-black/[0.035] px-[14px] py-[12px] text-[14px] tracking-[-0.02em] text-[#77787f]">{query.trim() ? 'No conversations found.' : 'No conversations yet. Start a new chat.'}</div>
            )}
          </section>
        </div>

        <div className="shrink-0 px-[28px] pb-[calc(env(safe-area-inset-bottom)+28px)]">
          <button type="button" className="flex h-[52px] w-full items-center gap-[13px] rounded-[16px] bg-white/80 px-[16px] text-left shadow-[0_10px_28px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.045] active:scale-[0.99]">
            <span className="flex h-[29px] w-[29px] items-center justify-center text-[#111114]"><Gift size={23} strokeWidth={1.9} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-medium tracking-[-0.025em] text-[#111114]">Invite friends to Kivo</span><span className="block truncate text-[12.5px] tracking-[-0.02em] text-[#8d8e95]">Get 500 credits each</span></span>
            <span className="text-[24px] font-light text-[#77787f]">›</span>
          </button>

          <div className="mt-[8px] flex h-[50px] items-center justify-between rounded-[17px] bg-white/70 px-[8px] shadow-[0_8px_24px_rgba(15,23,42,0.03)] ring-1 ring-black/[0.045]">
            <BottomNavItem active icon={<Home size={24} strokeWidth={1.9} />} label="Home" />
            <BottomNavItem icon={<MessageCircle size={23} strokeWidth={1.9} />} label="Messages" />
            <BottomNavItem icon={<Wrench size={23} strokeWidth={1.9} />} label="Discover" />
            <BottomNavItem icon={<FlaskConical size={23} strokeWidth={1.9} />} label="Labs" />
            <BottomNavItem icon={<Settings2 size={24} strokeWidth={1.9} />} label="Settings" />
          </div>
        </div>
      </aside>

      {renamingConversation ? (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/25 px-[24px] backdrop-blur-[5px]">
          <div className="w-full max-w-[330px] rounded-[24px] bg-white p-[18px] shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <h3 className="text-[19px] font-semibold tracking-[-0.035em] text-[#111114]">Rename chat</h3>
            <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} autoFocus className="mt-[14px] h-[48px] w-full rounded-[16px] bg-black/[0.045] px-[14px] text-[16px] outline-none" />
            <div className="mt-[16px] flex justify-end gap-[10px]">
              <button type="button" onClick={() => setRenamingConversation(null)} className="h-[40px] rounded-full px-[16px] text-[14px] text-[#6d6e74]">Cancel</button>
              <button type="button" onClick={submitRename} className="h-[40px] rounded-full bg-black px-[18px] text-[14px] text-white">Save</button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingConversation ? (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/25 px-[24px] backdrop-blur-[5px]">
          <div className="w-full max-w-[330px] rounded-[24px] bg-white p-[18px] shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
            <h3 className="text-[19px] font-semibold tracking-[-0.035em] text-[#111114]">Delete chat?</h3>
            <p className="mt-[8px] text-[14px] leading-[1.45] text-[#707177]">This will permanently delete “{deletingConversation.title}”.</p>
            <div className="mt-[16px] flex justify-end gap-[10px]">
              <button type="button" onClick={() => setDeletingConversation(null)} className="h-[40px] rounded-full px-[16px] text-[14px] text-[#6d6e74]">Cancel</button>
              <button type="button" onClick={confirmDelete} className="h-[40px] rounded-full bg-red-600 px-[18px] text-[14px] text-white">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
