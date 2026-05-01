'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronLeft, Eye, Lock, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  open: boolean;
  onBack: () => void;
  onClose: () => void;
};

function GoogleCalendarLargeIcon() {
  return (
    <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[18px] border border-[#ececef] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.035)]">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none"><rect x="7" y="7" width="30" height="30" rx="4.5" fill="#fff" /><path d="M11.5 7h21A4.5 4.5 0 0 1 37 11.5v5.7H7v-5.7A4.5 4.5 0 0 1 11.5 7Z" fill="#4285F4" /><path d="M7 17.2h7.5V37h-3A4.5 4.5 0 0 1 7 32.5V17.2Z" fill="#34A853" /><path d="M29.5 17.2H37v15.3a4.5 4.5 0 0 1-4.5 4.5h-3V17.2Z" fill="#FBBC04" /><path d="M14.5 17.2h15V37h-15V17.2Z" fill="#fff" /><text x="22" y="29" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#4285F4">31</text></svg>
    </div>
  );
}

function Capability({ icon, title, subtitle, divider = true }: any) {
  return (
    <div className="flex gap-[18px]"><div className="mt-[2px] flex h-[36px] w-[36px] items-center justify-center rounded-[11px] bg-[#f0f0f1] text-[#8b8c91]">{icon}</div><div className="flex-1"><div className="text-[17px] font-semibold">{title}</div><div className="text-[14.5px] text-[#67686d]">{subtitle}</div>{divider && <div className="mt-[14px] h-px bg-[#e7e7e9]" />}</div></div>
  );
}

function DetailRow({ label, value, arrow }: any) {
  return (
    <div className="flex h-[50px] items-center border-b"><div className="flex-1 text-[#5e5f64]">{label}</div>{value && <div>{value}</div>}{arrow && <ArrowUpRight size={21} />}</div>
  );
}

export function KivoCalendarConnectorDetail({ open, onBack, onClose }: Props) {
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
        const res = await fetch(`/api/integrations/google/calendar/status?userId=${userId}`);
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
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    window.location.href = `/api/integrations/google/calendar/connect?userId=${userId}`;
  }

  async function handleDisconnect() {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    setLoading(true);

    try {
      await fetch('/api/integrations/google/calendar/disconnect', {
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
    <div className="fixed inset-0 z-[120] bg-black/35">
      <button onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 h-[92vh] max-w-[430px] mx-auto bg-white rounded-t-[28px]">
        <div className="p-6">
          <GoogleCalendarLargeIcon />
          <h1 className="text-[26px] font-semibold mt-4">Google Calendar</h1>

          <button
            onClick={connected ? handleDisconnect : handleConnect}
            className={`mt-6 w-full h-[60px] rounded-xl text-white ${connected ? 'bg-red-500' : 'bg-black'}`}
          >
            {loading ? 'Loading...' : connected ? 'Disconnect Calendar' : 'Connect Calendar'}
          </button>
        </div>
      </section>
    </div>
  );
}
