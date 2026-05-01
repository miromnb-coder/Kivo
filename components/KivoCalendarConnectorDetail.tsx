'use client';

import { ArrowUpRight, CalendarDays, ChevronLeft, Eye, Lock, Sparkles } from 'lucide-react';
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

export function KivoCalendarConnectorDetail({ open, onBack, onClose }: Props) {
  if (!open) return null;

  async function handleConnect() {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    window.location.href = `/api/integrations/google/calendar/connect?userId=${userId}`;
  }

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
              Connect your calendar to Kivo to manage your schedule intelligently.
            </p>
          </div>

          <button onClick={handleConnect} className="mt-[28px] flex h-[62px] w-full items-center justify-center gap-[14px] rounded-[18px] bg-[#111113] text-[17px] font-semibold tracking-[-0.025em] text-white">
            <CalendarDays size={21} strokeWidth={2} />
            Connect Google Calendar
          </button>

          <div className="mt-[16px] flex items-center justify-center gap-[8px] text-[13.5px] tracking-[-0.02em] text-[#929399]">
            <Lock size={14} strokeWidth={2} />
            <span>Your data is private and secure.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
