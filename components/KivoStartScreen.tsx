'use client';

import { useState } from 'react';
import { Bell, Bot, FlaskConical, Folder, FolderPlus, Gift, Home, MessageCircle, Search, Settings2, SlidersHorizontal, Sparkles, UserRound, Wrench, X } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';

const recentConversations = [
  'Should I go vegan?',
  'Analysis of dog lifespan data',
  'ChatGPT plugin integration guide',
  'Risks of long-term pill use',
  'Understanding transformer models',
  'Firebase Studio deployment guide',
  'AI Life Operator: System Blueprint',
  'Git branch protection in Firebase',
  'GitHub pull request best practices',
  'Mobile app: Push notification setup',
];

function SidebarItem({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button type="button" className="flex h-[40px] w-full items-center gap-[18px] rounded-[14px] px-[6px] text-left text-[17px] tracking-[-0.025em] text-[#17181b]">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center text-[#6d6e74]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-full bg-[#efeff1] px-[9px] text-[16px] text-[#1f2023]">{badge}</span> : null}
    </button>
  );
}

function BottomNavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button type="button" className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] text-[11px] tracking-[-0.02em] ${active ? 'text-[#111114]' : 'text-[#606168]'}`}>
      <span className="flex h-[28px] items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function KivoSidebarOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <div className="flex h-[54px] items-center gap-[14px] rounded-[18px] bg-white/88 px-[16px] text-[17px] tracking-[-0.025em] text-[#8e9097] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035]">
            <Search size={25} strokeWidth={2.1} className="text-[#202024]" />
            <span>Search conversations</span>
          </div>
        </div>

        <div className="mt-[14px] px-[22px]">
          <button type="button" className="flex h-[54px] w-full items-center rounded-[18px] bg-white/88 px-[18px] text-left text-[17px] tracking-[-0.025em] text-[#111114] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.035]">
            <span className="mr-[16px] text-[29px] font-light leading-none">+</span>
            <span className="flex-1">New chat</span>
            <span className="mr-[5px] rounded-[9px] bg-[#eeeef1] px-[8px] py-[5px] text-[14px] text-[#606168]">⌘</span>
            <span className="rounded-[9px] bg-[#eeeef1] px-[8px] py-[5px] text-[14px] text-[#606168]">K</span>
          </button>
        </div>

        <div className="mt-[14px] flex shrink-0 gap-[8px] px-[22px]">
          <button type="button" className="h-[36px] rounded-full bg-black px-[18px] text-[15px] text-white">All</button>
          <button type="button" className="h-[36px] rounded-full bg-white/55 px-[18px] text-[15px] text-[#77787f] ring-1 ring-black/[0.06]">Favorites</button>
          <button type="button" className="h-[36px] rounded-full bg-white/55 px-[18px] text-[15px] text-[#77787f] ring-1 ring-black/[0.06]">Scheduled</button>
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
            <div className="space-y-[7px]">
              {recentConversations.map((title) => (
                <button key={title} type="button" className="flex h-[30px] w-full items-center gap-[14px] text-left text-[14px] tracking-[-0.025em] text-[#17181b]">
                  <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[#707177]"><MessageCircle size={16} strokeWidth={1.8} /></span>
                  <span className="truncate">{title}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="shrink-0 px-[22px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button type="button" className="flex h-[62px] w-full items-center gap-[14px] rounded-[18px] bg-white/80 px-[18px] text-left shadow-[0_10px_30px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.045]">
            <span className="flex h-[34px] w-[34px] items-center justify-center text-[#111114]"><Gift size={25} strokeWidth={1.9} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-medium tracking-[-0.025em] text-[#111114]">Invite friends to Kivo</span>
              <span className="block truncate text-[13px] tracking-[-0.02em] text-[#8d8e95]">Get 500 credits each</span>
            </span>
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

export function KivoStartScreen() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [messages, setMessages] = useState<KivoChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSend(message: string) {
    const userMsg: KivoChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '', steps: [] }]);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error('Please sign in again to use Kivo memory.');

      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, userId }) });
      if (!res.ok) throw new Error(`Agent request failed (${res.status})`);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Agent stream did not start');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          if (!part.startsWith('event:')) continue;
          const lines = part.split('\n');
          const eventLine = lines.find((line) => line.startsWith('event: '));
          const dataLine = lines.find((line) => line.startsWith('data: '));
          if (!eventLine || !dataLine) continue;
          const event = eventLine.replace('event: ', '');
          const data = JSON.parse(dataLine.replace('data: ', ''));
          if (event === 'token') setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data.token } : m)));
          if (event === 'done') setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />
      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <div className="fixed left-1/2 top-0 z-50 w-full max-w-[430px] -translate-x-1/2">
          <KivoTopBar onOpenMenu={() => setSidebarOpen(true)} />
        </div>

        <KivoChatMessages messages={messages} loading={loading} />
        <KivoSidebarOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <section className={`absolute left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-[36px] text-center transition-all duration-300 ease-out ${isKeyboardMode || messages.length > 0 ? 'top-[20%] scale-[0.9] opacity-0 pointer-events-none' : 'top-[51%] scale-100 opacity-100'}`}>
          <h1 className="mx-auto max-w-[320px] text-[32px] leading-[1.2] tracking-[-0.04em] text-[#202024]">How can I help you today?</h1>
          <p className="mt-[18px] text-[17px] tracking-[-0.02em] text-[#b2b2b7]">Your personal AI assistant</p>
        </section>

        <KivoComposer onFocusChange={setIsKeyboardMode} onSubmitMessage={handleSend} disabled={loading} />
      </div>
    </main>
  );
}
