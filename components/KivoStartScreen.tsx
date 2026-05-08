'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoTodayDashboard } from './KivoTodayDashboard';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';
import { KivoSidebarOverlay, type KivoConversation, type SidebarFilter } from './KivoSidebarOverlay';
import { type KivoAttachment } from './KivoAttachments';

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

type SwipeMode = 'idle' | 'horizontal' | 'vertical';

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

function createConversationTitle(message: string, attachmentCount = 0) {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (!cleaned && attachmentCount > 0) return attachmentCount === 1 ? 'Image' : `${attachmentCount} images`;
  if (!cleaned) return 'New conversation';
  return cleaned.length > 54 ? `${cleaned.slice(0, 54).trim()}…` : cleaned;
}

function shouldIgnoreOpenSwipeStart(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest('a, button, input, textarea, select, [role="button"], [contenteditable="true"]'));
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
  const edgeSwipeStartXRef = useRef(0);
  const edgeSwipeStartYRef = useRef(0);
  const edgeSwipeStartTimeRef = useRef(0);
  const swipeModeRef = useRef<SwipeMode>('idle');
  const [edgeSwipeActive, setEdgeSwipeActive] = useState(false);

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

  function openSidebar() {
    refreshConversations();
    setSidebarOpen(true);
  }

  function handleEdgePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (sidebarOpen || loading || shouldIgnoreOpenSwipeStart(event.target)) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    edgeSwipeStartXRef.current = event.clientX;
    edgeSwipeStartYRef.current = event.clientY;
    edgeSwipeStartTimeRef.current = Date.now();
    swipeModeRef.current = 'idle';
    setEdgeSwipeActive(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleEdgePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!edgeSwipeActive || sidebarOpen) return;

    const deltaX = event.clientX - edgeSwipeStartXRef.current;
    const deltaY = event.clientY - edgeSwipeStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (swipeModeRef.current === 'idle') {
      if (absY > 10 && absY > absX * 1.1) {
        swipeModeRef.current = 'vertical';
        return;
      }

      if (deltaX > 18 && absX > absY * 1.25) {
        swipeModeRef.current = 'horizontal';
      }
    }

    if (swipeModeRef.current !== 'horizontal') return;

    event.preventDefault();
    if (deltaX > 70) {
      setEdgeSwipeActive(false);
      swipeModeRef.current = 'idle';
      openSidebar();
    }
  }

  function handleEdgePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!edgeSwipeActive) return;

    const deltaX = event.clientX - edgeSwipeStartXRef.current;
    const deltaY = event.clientY - edgeSwipeStartYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const elapsed = Math.max(1, Date.now() - edgeSwipeStartTimeRef.current);
    const velocity = deltaX / elapsed;

    setEdgeSwipeActive(false);

    if (swipeModeRef.current === 'horizontal' && absX > absY * 1.18 && (deltaX > 86 || velocity > 0.42)) {
      openSidebar();
    }

    swipeModeRef.current = 'idle';
  }

  async function createConversation(userId: string, firstMessage: string, attachmentCount = 0) {
    const supabase = createSupabaseBrowser();
    const title = createConversationTitle(firstMessage, attachmentCount);
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
          attachments: message.attachments ?? null,
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
        attachments: row.metadata?.attachments ?? undefined,
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

  async function handleSend(message: string, attachments: KivoAttachment[] = []) {
    const userId = await getUserId();
    if (!userId) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: '', error: 'Please sign in again to use Kivo memory.' }]);
      return;
    }

    const conversationId = activeConversationId ?? (await createConversation(userId, message, attachments.length));
    const userMsg: KivoChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, attachments };
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
        body: JSON.stringify({ message, userId, attachments }),
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

  const showTodayDashboard = !isKeyboardMode && messages.length === 0 && !loading;
  const composerMessageCount = showTodayDashboard ? 1 : messages.length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />
      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <div
          onPointerDownCapture={handleEdgePointerDown}
          onPointerMoveCapture={handleEdgePointerMove}
          onPointerUpCapture={handleEdgePointerUp}
          onPointerCancelCapture={handleEdgePointerUp}
          className="absolute inset-0 min-h-screen w-full touch-pan-y will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: sidebarOpen ? 'translate3d(min(86vw, 370px), 0, 0)' : 'translate3d(0, 0, 0)' }}
        >
          <div className="fixed left-1/2 top-0 z-50 w-full max-w-[430px] -translate-x-1/2">
            <KivoTopBar onOpenMenu={openSidebar} />
          </div>

          <KivoChatMessages messages={messages} loading={loading} />

          {showTodayDashboard ? <KivoTodayDashboard /> : null}

          <KivoComposer
            conversationId={activeConversationId}
            messageCount={composerMessageCount}
            onFocusChange={setIsKeyboardMode}
            onSubmitMessage={handleSend}
            disabled={loading}
          />
        </div>

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
      </div>
    </main>
  );
}
