'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';

export function KivoStartScreen() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [messages, setMessages] = useState<KivoChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSend(message: string) {
    const userMsg: KivoChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
    };

    const assistantId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        steps: [],
      },
    ]);

    setLoading(true);

    try {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) throw new Error('Please sign in again to use Kivo memory.');

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
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + data.token } : m)));
          }

          if (event === 'done') {
            setLoading(false);
          }
        }
      }
    } catch (error) {
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

        {/* SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60]">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-[6px]"
              onClick={() => setSidebarOpen(false)}
            />

            {/* panel */}
            <div className="absolute left-0 top-0 h-full w-[88%] max-w-[360px] bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-r-[28px] p-[18px] flex flex-col gap-[16px]">

              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="h-[36px] w-[36px] rounded-[10px] bg-black flex items-center justify-center text-white">⚡</div>
                  <span className="text-[18px] font-semibold">Kivo</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="h-[32px] w-[32px] rounded-full bg-black/5">✕</button>
              </div>

              {/* SEARCH */}
              <div className="h-[42px] rounded-full bg-black/5 px-[14px] flex items-center text-[14px] text-black/50">
                Search conversations
              </div>

              {/* NEW CHAT */}
              <div className="h-[44px] rounded-[14px] bg-black/5 flex items-center px-[14px] gap-[10px]">
                + New chat
              </div>

              {/* MENU LIST */}
              <div className="flex flex-col gap-[14px] text-[15px]">
                <div>Chat</div>
                <div>Agents</div>
                <div>Tools</div>
                <div>Notifications</div>
              </div>

            </div>
          </div>
        )}

        <section className={`absolute left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-[36px] text-center transition-all duration-300 ease-out ${isKeyboardMode || messages.length > 0 ? 'top-[20%] scale-[0.9] opacity-0 pointer-events-none' : 'top-[51%]'}`}>
          <h1 className="text-[32px]">How can I help you today?</h1>
          <p className="text-[17px] text-black/40">Your personal AI assistant</p>
        </section>

        <KivoComposer onFocusChange={setIsKeyboardMode} onSubmitMessage={handleSend} disabled={loading} />
      </div>
    </main>
  );
}
