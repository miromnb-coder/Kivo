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

function GoogleCalendarLargeIcon() {
  return (
    <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[18px] border border-[#ececef] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.035)]">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect x="7" y="7" width="30" height="30" rx="4.5" fill="#fff" />
        <path d="M11.5 7h21A4.5 4.5 0 0 1 37 11.5v5.7H7v-5.7A4.5 4.5 0 0 1 11.5 7Z" fill="#4285F4" />
        <path d="M7 17.2h7.5V37h-3A4.5 4.5 0 0 1 7 32.5V17.2Z" fill="#34A853" />
        <path d="M29.5 17.2H37v15.3a4.5 4.5 0 0 1-4.5 4.5h-3V17.2Z" fill="#FBBC04" />
        <path d="M14.5 17.2h15V37h-15V17.2Z" fill="#fff" />
        <text x="22" y="29" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#4285F4">31</text>
      </svg>
    </div>
  );
}

function Capability({ icon, title, subtitle, divider = true }: { icon: React.ReactNode; title: string; subtitle: string; divider?: boolean }) {
  return (
    <div className="flex gap-[18px]">
      <div className="mt-[2px] flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[11px] bg-[#f0f0f1] text-[#8b8c91]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[17px] font-semibold leading-[1.18] tracking-[-0.035em] text-[#191a1d]">{title}</div>
        <div className="mt-[4px] text-[14.5px] leading-[1.25] tracking-[-0.025em] text-[#67686d]">{subtitle}</div>
        {divider ? <div className="mt-[14px] h-px bg-[#e7e7e9]" /> : null}
      </div>
    </div>
  );
}

function DetailRow({ label, value, arrow }: { label: string; value?: string; arrow?: boolean }) {
  return (
    <div className="flex h-[50px] items-center border-b border-[#e7e7e9] last:border-b-0">
      <div className="flex-1 text-[15.5px] tracking-[-0.025em] text-[#5e5f64]">{label}</div>
      {value ? <div className="text-[15.5px] tracking-[-0.025em] text-[#222327]">{value}</div> : null}
      {arrow ? <ArrowUpRight size={21} strokeWidth={2} className="text-[#74757a]" /> : null}
    </div>
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
    if (connected || loading) return;

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    window.location.href = `/api/integrations/google/calendar/connect?userId=${userId}`;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[3px]">
      <button type="button" aria-label="Close connector detail" onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc] shadow-[0_-18px_46px_rgba(0,0,0,0.16)]">
        <div className="absolute left-0 right-0 top-0 z-10 bg-[#fbfbfc]/92 px-[18px] pt-[14px] backdrop-blur-xl">
          <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
          <button type="button" onClick={onBack} aria-label="Back" className="mt-[18px] flex h-[40px] w-[40px] items-center justify-center text-[#191a1d]">
            <ChevronLeft size={26} strokeWidth={2.1} />
          </button>
        </div>

        <div className="h-full overflow-y-auto px-[26px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[88px]">
          <div className="flex flex-col items-center text-center">
            <GoogleCalendarLargeIcon />
            <h1 className="mt-[20px] text-[26px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111214]">Google Calendar</h1>
            <p className="mt-[14px] max-w-[340px] text-[17px] leading-[1.42] tracking-[-0.035em] text-[#4f5055]">
              Connect your calendar to Kivo to manage your schedule intelligently. See your events, find the best time for tasks, and keep your day on track.
            </p>
          </div>

          <div className="mt-[32px] rounded-[22px] border border-[#ececef] bg-white/46 px-[20px] py-[18px] shadow-[0_8px_26px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
            <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#111214]">Kivo will be able to:</h2>
            <div className="mt-[18px] space-y-[14px]">
              <Capability icon={<Eye size={19} strokeWidth={2.1} />} title="View your schedule" subtitle="See your events, calendars, and availability." />
              <Capability icon={<Sparkles size={19} strokeWidth={2.1} />} title="Suggest better time usage" subtitle="Get AI-powered suggestions to optimize your day." />
              <Capability icon={<CalendarDays size={19} strokeWidth={2.1} />} title="Create and manage events" subtitle="Create, update, and delete events with your approval." divider={false} />
            </div>
          </div>

          <h2 className="mt-[28px] text-[18px] font-semibold tracking-[-0.035em] text-[#111214]">Details</h2>
          <div className="mt-[12px] rounded-[22px] border border-[#ececef] bg-white/46 px-[18px] shadow-[0_8px_26px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
            <DetailRow label="Connector Type" value="App" />
            <DetailRow label="Built by" value="Kivo" />
            <DetailRow label="Website" arrow />
            <DetailRow label="Privacy Policy" arrow />
            <DetailRow label="Permissions" arrow />
          </div>

          <button
            type="button"
            onClick={handleConnect}
            disabled={loading || connected}
            className={`mt-[28px] flex h-[62px] w-full items-center justify-center gap-[14px] rounded-[18px] text-[17px] font-semibold tracking-[-0.025em] text-white shadow-[0_16px_32px_rgba(0,0,0,0.14)] transition-all ${
              connected ? 'bg-[#2f7d4f]' : 'bg-[#111113]'
            } ${loading ? 'opacity-60' : ''}`}
          >
            {connected ? <Check size={21} strokeWidth={2.2} /> : <CalendarDays size={21} strokeWidth={2} />}
            {loading ? 'Checking status...' : connected ? 'Connected' : 'Connect Google Calendar'}
          </button>

          <div className="mt-[16px] flex items-center justify-center gap-[8px] text-[13.5px] tracking-[-0.02em] text-[#929399]">
            <Lock size={14} strokeWidth={2} />
            <span>Your data is private and secure. You can disconnect anytime.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
