'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, Lock } from 'lucide-react';
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

export function KivoCalendarConnectorDetail({ open, onBack, onClose }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function checkStatus() {
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
        setConnected(json.connected);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[3px]">
      <button onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] rounded-t-[28px] bg-[#fbfbfc]">
        <div className="px-[18px] pt-[14px]">
          <button onClick={onBack} className="mt-[18px]">
            <ChevronLeft />
          </button>
        </div>

        <div className="px-[26px] pt-[40px]">
          <h1 className="text-[26px] font-semibold">Google Calendar</h1>

          <button
            onClick={handleConnect}
            disabled={loading || connected}
            className={`mt-[28px] flex h-[62px] w-full items-center justify-center gap-[14px] rounded-[18px] text-[17px] font-semibold text-white
              ${connected ? 'bg-[#1f7a3e]' : 'bg-[#111113]'}
              ${loading ? 'opacity-60' : ''}
            `}
          >
            {connected ? (
              <>
                <Check size={20} />
                Connected
              </>
            ) : (
              <>
                <CalendarDays size={20} />
                Connect Google Calendar
              </>
            )}
          </button>

          <div className="mt-[16px] flex justify-center text-[13px] text-[#929399]">
            <Lock size={14} /> Your data is private
          </div>
        </div>
      </section>
    </div>
  );
}
