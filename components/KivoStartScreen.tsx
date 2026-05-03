'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';
import { KivoSidebarOverlay, type KivoConversation, type SidebarFilter } from './KivoSidebarOverlay';

// (rest of file unchanged except removed sidebar code)

export function KivoStartScreen() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [messages, setMessages] = useState<KivoChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<KivoConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');

  async function getUserId() {
    const supabase = createSupabaseBrowser();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  async function refreshConversations(userId?: string | null) {
    const resolvedUserId = userId ?? (await getUserId());
    if (!resolvedUserId) return;

    const supabase = createSupabaseBrowser();
    const { data } = await supabase
      .from('kivo_conversations')
      .select('id,title,updated_at,is_favorite,status')
      .eq('user_id', resolvedUserId)
      .order('updated_at', { ascending: false })
      .limit(60);

    setConversations((data ?? []) as KivoConversation[]);
  }

  useEffect(() => {
    refreshConversations();
  }, []);

  function startNewChat() {
    setMessages([]);
    setActiveConversationId(null);
    setSidebarOpen(false);
    setIsKeyboardMode(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />
      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <div className="fixed left-1/2 top-0 z-50 w-full max-w-[430px] -translate-x-1/2">
          <KivoTopBar onOpenMenu={() => { refreshConversations(); setSidebarOpen(true); }} />
        </div>

        <KivoChatMessages messages={messages} loading={loading} />

        <KivoSidebarOverlay
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          filter={sidebarFilter}
          query={sidebarQuery}
          onFilterChange={setSidebarFilter}
          onQueryChange={setSidebarQuery}
          onNewChat={startNewChat}
          onOpenConversation={(id) => setActiveConversationId(id)}
        />

        <KivoComposer onFocusChange={setIsKeyboardMode} onSubmitMessage={() => {}} disabled={loading} />
      </div>
    </main>
  );
}
