'use client';

import { useState } from 'react';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';

export function KivoStartScreen() {
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [messages, setMessages] = useState<KivoChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

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
        steps: [{ label: 'Thinking', status: 'active' }],
      },
    ]);

    setLoading(true);

    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.startsWith('event:')) continue;

        const [, eventLine, dataLine] = part.split('\n');
        const event = eventLine.replace('event: ', '');
        const data = JSON.parse(dataLine.replace('data: ', ''));

        if (event === 'token') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + data.token }
                : m,
            ),
          );
        }

        if (event === 'meta') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, model: data.model, provider: data.provider }
                : m,
            ),
          );
        }

        if (event === 'done') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, steps: undefined }
                : m,
            ),
          );
          setLoading(false);
        }
      }
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px] overflow-hidden">
        <div className="fixed left-1/2 top-0 z-50 w-full max-w-[430px] -translate-x-1/2 bg-transparent">
          <KivoTopBar />
        </div>

        <KivoChatMessages messages={messages} loading={loading} />

        <section
          className={`absolute left-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-[36px] text-center transition-all duration-300 ease-out ${
            isKeyboardMode || messages.length > 0 ? 'top-[20%] scale-[0.9] opacity-0 pointer-events-none' : 'top-[51%] scale-100 opacity-100'
          }`}
        >
          <h1 className="mx-auto max-w-[320px] text-[32px] leading-[1.2] tracking-[-0.04em] text-[#202024]">
            How can I help you today?
          </h1>
          <p className="mt-[18px] text-[17px] tracking-[-0.02em] text-[#b2b2b7]">
            Your personal AI assistant
          </p>
        </section>

        <KivoComposer onFocusChange={setIsKeyboardMode} onSubmitMessage={handleSend} disabled={loading} />
      </div>
    </main>
  );
}
