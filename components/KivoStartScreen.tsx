'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';
import { KivoSidebarOverlay, type KivoConversation, type SidebarFilter } from './KivoSidebarOverlay';

type StreamStep = {
  id?: string;
  title?: string;
  label?: string;
  detail?: string;
  status?: string;
  kind?: string;
};

type BrowserPreviewEvent = {
  url?: string;
  title?: string;
  action?: 'open' | 'search' | 'read' | 'click' | 'type' | 'scroll' | 'extract' | 'done';
  actionLabel?: string;
  screenshotUrl?: string;
  highlight?: { x: number; y: number; width: number; height: number };
  cursor?: { x: number; y: number };
  status?: 'idle' | 'running' | 'done';
};

function getStepKey(step: StreamStep) {
  return step.id || step.title || step.label || 'step';
}

function mergeStep(prevSteps: StreamStep[] = [], nextStep: StreamStep) {
  const key = getStepKey(nextStep);
  const index = prevSteps.findIndex((step) => getStepKey(step) === key);
  if (index === -1) return [...prevSteps, nextStep];
  return prevSteps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...nextStep } : step));
}

function mergeBrowserPreview(prevPreview: BrowserPreviewEvent | undefined, nextPreview: BrowserPreviewEvent) {
  return { ...(prevPreview ?? {}), ...nextPreview };
}

function createConversationTitle(message: string) {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New conversation';
  return cleaned.length > 54 ? `${cleaned.slice(0, 54).trim()}…` : cleaned;
}

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

    try {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from('kivo_conversations')
        .select('id,title,updated_at,is_favorite,status')
        .eq('user_id', resolvedUserId)
        .order('updated_at', { ascending: false })
        .limit(60);

      if (error) throw error;
      setConversations((data ?? []) as KivoConversation[]);
    } catch (error) {
      console.warn('Could not load Kivo conversations.', error);
    }
  }

  useEffect(() => {
    refreshConversations();
  }, []);

  async function createConversation(userId: string, firstMessage: string) {
    const supabase = createSupabaseBrowser();
    const title = createConversationTitle(firstMessage);
    const { data, error } = await supabase
      .from('kivo_conversations')
      .insert({ user_id: userId, title })
      .select('id,title,updated_at,is_favorite,status')
      .single();

    if (error) throw error;
    setActiveConversationId(data.id);
    setConversations((prev) => [data as KivoConversation, ...prev.filter((conversation) => conversation.id !== data.id)]);
    return data.id as string;
  }

  async function saveMessage(conversationId: string, userId: string, message: KivoChatMessage) {
    try {
      const supabase = createSupabaseBrowser();
      await supabase.from('kivo_messages').insert({
        conversation_id: conversationId,
        user_id: userId,
        role: message.role,
        content: message.content,
        metadata: {
          steps: message.steps ?? null,
          browserPreview: message.browserPreview ?? null,
          model: message.model ?? null,
          provider: message.provider ?? null,
          structuredData: message.structuredData ?? null,
          error: message.error ?? null,
        },
      });

      await supabase
        .from('kivo_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', userId);

      await refreshConversations(userId);
    } catch (error) {
      console.warn('Could not save Kivo message.', error);
    }
  }

  async function openConversation(conversationId: string) {
    const userId = await getUserId();
    if (!userId) return;

    setLoading(false);

    try {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from('kivo_messages')
        .select('id,role,content,metadata,created_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const restoredMessages = (data ?? []).map((row: any) => ({
        id: row.id,
        role: row.role,
        content: row.content ?? '',
        steps: row.metadata?.steps ?? undefined,
        browserPreview: row.metadata?.browserPreview ?? undefined,
        model: row.metadata?.model ?? undefined,
        provider: row.metadata?.provider ?? undefined,
        structuredData: row.metadata?.structuredData ?? undefined,
        error: row.metadata?.error ?? undefined,
      })) as KivoChatMessage[];

      setMessages(restoredMessages);
      setActiveConversationId(conversationId);
      setSidebarOpen(false);
      setIsKeyboardMode(false);
    } catch (error) {
      console.warn('Could not open Kivo conversation.', error);
    }
  }

  async function renameConversation(conversationId: string, title: string) {
    const userId = await getUserId();
    if (!userId) return;

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase
        .from('kivo_conversations')
        .update({ title })
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      setConversations((prev) => prev.map((conversation) => (conversation.id === conversationId ? { ...conversation, title } : conversation)));
    } catch (error) {
      console.warn('Could not rename Kivo conversation.', error);
    }
  }

  async function deleteConversation(conversationId: string) {
    const userId = await getUserId();
    if (!userId) return;

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase
        .from('kivo_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
      setConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));

      if (activeConversationId === conversationId) {
        setMessages([]);
        setActiveConversationId(null);
        setIsKeyboardMode(false);
      }
    } catch (error) {
      console.warn('Could not delete Kivo conversation.', error);
    }
  }

  function startNewChat() {
    setMessages([]);
    setActiveConversationId(null);
    setSidebarOpen(false);
    setIsKeyboardMode(false);
  }

  async function handleSend(message: string) {
    const userId = await getUserId();
    if (!userId) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: '', error: 'Please sign in again to use Kivo memory.' }]);
      return;
    }

    const conversationId = activeConversationId ?? (await createConversation(userId, message));
    const userMsg: KivoChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
    const assistantId = crypto.randomUUID();
    let assistantContent = '';
    let assistantSnapshot: KivoChatMessage = { id: assistantId, role: 'assistant', content: '', steps: [] };

    setMessages((prev) => [...prev, userMsg, assistantSnapshot]);
    setLoading(true);
    await saveMessage(conversationId, userId, userMsg);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId }),
      });

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

          if (event === 'token') {
            assistantContent += data.token;
            assistantSnapshot = { ...assistantSnapshot, content: assistantContent };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data.token } : m)));
          }

          if (event === 'step') {
            assistantSnapshot = { ...assistantSnapshot, steps: mergeStep(assistantSnapshot.steps ?? [], data) };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, steps: mergeStep(m.steps ?? [], data) } : m)));
          }

          if (event === 'browser') {
            assistantSnapshot = { ...assistantSnapshot, browserPreview: mergeBrowserPreview(assistantSnapshot.browserPreview, data) };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, browserPreview: mergeBrowserPreview(m.browserPreview, data) } : m)));
          }

          if (event === 'meta') {
            assistantSnapshot = { ...assistantSnapshot, model: data.model, provider: data.provider };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, model: data.model, provider: data.provider } : m)));
          }

          if (event === 'data') {
            assistantSnapshot = { ...assistantSnapshot, structuredData: data.structuredData };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, structuredData: data.structuredData } : m)));
          }

          if (event === 'error') {
            const errorMessage = data.message ?? 'Kivo could not answer right now.';
            assistantSnapshot = { ...assistantSnapshot, steps: undefined, content: '', error: errorMessage };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? assistantSnapshot : m)));
            setLoading(false);
          }

          if (event === 'done') {
            assistantSnapshot = {
              ...assistantSnapshot,
              content: data.content ?? assistantSnapshot.content,
              structuredData: data.structuredData ?? assistantSnapshot.structuredData,
              browserPreview: assistantSnapshot.browserPreview ? { ...assistantSnapshot.browserPreview, status: 'done', action: 'done', actionLabel: 'Browser task complete' } : assistantSnapshot.browserPreview,
            };
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? assistantSnapshot : m)));
            setLoading(false);
            await saveMessage(conversationId, userId, assistantSnapshot);
          }
        }
      }
    } catch (error) {
      assistantSnapshot = { ...assistantSnapshot, steps: undefined, content: '', error: error instanceof Error ? error.message : 'Kivo could not answer right now.' };
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? assistantSnapshot : m)));
      setLoading(false);
      await saveMessage(conversationId, userId, assistantSnapshot);
    }
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
          onOpenConversation={openConversation}
          onRenameConversation={renameConversation}
          onDeleteConversation={deleteConversation}
        />

        <section className={`absolute left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-[36px] text-center transition-all duration-300 ease-out ${isKeyboardMode || messages.length > 0 ? 'top-[20%] scale-[0.9] opacity-0 pointer-events-none' : 'top-[51%] scale-100 opacity-100'}`}>
          <h1 className="mx-auto max-w-[320px] text-[32px] leading-[1.2] tracking-[-0.04em] text-[#202024]">How can I help you today?</h1>
          <p className="mt-[18px] text-[17px] tracking-[-0.02em] text-[#b2b2b7]">Your personal AI assistant</p>
        </section>

        <KivoComposer onFocusChange={setIsKeyboardMode} onSubmitMessage={handleSend} disabled={loading} />
      </div>
    </main>
  );
}
