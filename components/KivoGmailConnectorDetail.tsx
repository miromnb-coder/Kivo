'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, Eye, Inbox, Lock, Mail, Sparkles, Trash2 } from 'lucide-react';
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

function GmailLargeIcon() {
  return (
    <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[18px] border border-[#ececef] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.035)]">
      <svg width="46" height="38" viewBox="0 0 46 38" fill="none" aria-hidden="true">
        <path d="M5.5 8.7v20.6c0 1.8 1.45 3.2 3.2 3.2h6.35V16.35L5.5 8.7Z" fill="#34A853" />
        <path d="M30.95 32.5h6.35c1.75 0 3.2-1.4 3.2-3.2V8.7l-9.55 7.65V32.5Z" fill="#4285F4" />
        <path d="M15.05 16.35V32.5h15.9V16.35L23 22.45l-7.95-6.1Z" fill="#EA4335" />
        <path d="M5.5 8.7 23 22.45 40.5 8.7c-.2-1.75-1.6-3.2-3.2-3.2h-1.95L23 15.2 10.65 5.5H8.7c-1.6 0-3 1.45-3.2 3.2Z" fill="#FBBC04" />
        <path d="M5.5 8.7 23 22.45l3.05-2.4L10.65 5.5H8.7c-1.6 0-3 1.45-3.2 3.2Z" fill="#EA4335" />
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

export function KivoGmailConnectorDetail({ open, onBack, onClose }: Props) {
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
    if (!connected || loading) return;

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (!userId) return;

    setLoading(true);

    try {
      const res = await fetch('/api/integrations/google/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) setConnected(false);
    } catch {
      // Keep current status if disconnect fails.
    }

    setLoading(false);
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
            <GmailLargeIcon />
            <h1 className="mt-[20px] text-[26px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111214]">Gmail</h1>
            <p className="mt-[14px] max-w-[340px] text-[17px] leading-[1.42] tracking-[-0.035em] text-[#4f5055]">
              Connect Gmail to Kivo to understand your inbox intelligently. See important emails, find receipts, and keep your tasks on track.
            </p>
          </div>

          <div className="mt-[32px] rounded-[22px] border border-[#ececef] bg-white/46 px-[20px] py-[18px] shadow-[0_8px_26px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
            <h2 className="text-[16px] font-semibold tracking-[-0.03em] text-[#111214]">Kivo will be able to:</h2>
            <div className="mt-[18px] space-y-[14px]">
              <Capability icon={<Eye size={19} strokeWidth={2.1} />} title="View your emails" subtitle="Read message metadata and email content you allow." />
              <Capability icon={<Sparkles size={19} strokeWidth={2.1} />} title="Find important items" subtitle="Spot receipts, bills, renewals, and action items." />
              <Capability icon={<Inbox size={19} strokeWidth={2.1} />} title="Summarize your inbox" subtitle="Turn recent emails into clear, useful briefings." divider={false} />
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
            {connected ? <Check size={21} strokeWidth={2.2} /> : <Mail size={21} strokeWidth={2} />}
            {loading ? 'Checking status...' : connected ? 'Connected' : 'Connect Gmail'}
          </button>

          {connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className={`mt-[12px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[16px] bg-[#f2f2f3] text-[16px] font-medium tracking-[-0.025em] text-[#c7332f] ${loading ? 'opacity-60' : ''}`}
            >
              <Trash2 size={17} strokeWidth={2.1} />
              Disconnect Gmail
            </button>
          ) : null}

          <div className="mt-[16px] flex items-center justify-center gap-[8px] text-[13.5px] tracking-[-0.02em] text-[#929399]">
            <Lock size={14} strokeWidth={2} />
            <span>Your data is private and secure. You can disconnect anytime.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
