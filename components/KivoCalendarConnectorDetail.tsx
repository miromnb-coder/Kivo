'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronLeft, Eye, Lock, Sparkles } from 'lucide-react';
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

function Capability({ icon, title, subtitle, divider = true }: any) {
  return (
    <div className="flex gap-[18px]">
      <div className="mt-[2px] flex h-[36px] w-[36px] items-center justify-center rounded-[11px] bg-[#f0f0f1] text-[#8b8c91]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[17px] font-semibold text-[#191a1d]">{title}</div>
        <div className="text-[14px] text-[#67686d]">{subtitle}</div>
        {divider && <div className="mt-[12px] h-px bg-[#e7e7e9]" />}
      </div>
    </div>
  );
}

export function KivoCalendarConnectorDetail({ open, onBack, onClose }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    async function checkStatus() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      if (!userId) return;

      const res = await fetch(`/api/integrations/google/calendar/status?userId=${userId}`);
      const json = await res.json();
      setConnected(json.connected);
      setLoading(false);
    }

    checkStatus();
  }, [open]);

  async function handleConnect() {
    if (connected) return;

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    window.location.href = `/api/integrations/google/calendar/connect?userId=${userId}`;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[3px]">
      <button onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] overflow-y-auto rounded-t-[28px] bg-[#fbfbfc] px-[26px] pt-[80px] pb-[40px]">
        <button onClick={onBack} className="absolute top-[20px] left-[18px]">
          <ChevronLeft size={26} />
        </button>

        <h1 className="text-[26px] font-semibold text-center">Google Calendar</h1>

        <p className="mt-[12px] text-center text-[#4f5055]">
          Connect your calendar to Kivo to manage your schedule intelligently.
        </p>

        <div className="mt-[28px] bg-white rounded-[20px] p-[16px]">
          <Capability icon={<Eye size={18} />} title="View your schedule" subtitle="See events" />
          <Capability icon={<Sparkles size={18} />} title="Suggest time" subtitle="AI suggestions" />
          <Capability icon={<CalendarDays size={18} />} title="Manage events" subtitle="Create & edit" divider={false} />
        </div>

        <button
          onClick={handleConnect}
          disabled={loading || connected}
          className={`mt-[28px] w-full h-[60px] rounded-[16px] text-white font-semibold flex items-center justify-center gap-[10px]
            ${connected ? 'bg-[#2f7d4f]' : 'bg-black'}
          `}
        >
          {connected ? <Check /> : <CalendarDays />}
          {connected ? 'Connected' : 'Connect Google Calendar'}
        </button>

        <div className="mt-[12px] text-center text-[13px] text-gray-400">
          <Lock size={14} /> Your data is private
        </div>
      </section>
    </div>
  );
}
