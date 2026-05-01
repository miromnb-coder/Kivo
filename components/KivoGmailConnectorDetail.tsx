'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, Eye, Inbox, Lock, Mail, Sparkles } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function KivoGmailConnectorDetail({ open, onBack, onClose }: any) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function checkStatus() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) {
        setConnected(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/integrations/google/gmail/status?userId=${userId}`);
        const json = await res.json();
        setConnected(Boolean(json.connected));
      } catch {
        setConnected(false);
      }

      setLoading(false);
    }

    checkStatus();
  }, [open]);

  async function handleConnect() {
    if (connected || loading) return;

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    window.location.href = `/api/integrations/google/gmail/connect?userId=${userId}`;
  }

  async function handleDisconnect() {
    if (!connected) return;

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    setLoading(true);

    try {
      await fetch('/api/integrations/google/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      setConnected(false);
    } catch {}

    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[3px]">
      <button type="button" onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc]">
        <div className="px-[26px] pt-[100px]">
          <h1 className="text-[26px] font-semibold">Gmail</h1>

          <button
            type="button"
            onClick={connected ? handleDisconnect : handleConnect}
            className={`mt-[28px] h-[62px] w-full rounded-[18px] text-white ${connected ? 'bg-red-500' : 'bg-black'}`}
          >
            {loading ? 'Loading...' : connected ? 'Disconnect Gmail' : 'Connect Gmail'}
          </button>
        </div>
      </section>
    </div>
  );
}
