'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Inbox,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { KivoCalendarConnectorDetail } from './KivoCalendarConnectorDetail';
import { KivoConnectorDetail } from './KivoConnectorDetail';
import { KivoGmailConnectorDetail } from './KivoGmailConnectorDetail';

type KivoConnectorsSheetProps = { open: boolean; onClose: () => void };
type ConnectorIconId = 'gmail' | 'google-calendar' | 'drive' | 'outlook-mail' | 'outlook-calendar';
type ConnectorConfig = {
  name: string;
  icon: ConnectorIconId;
  title: string;
  description: string;
  connectorType: string;
  author: string;
  buttonLabel: string;
  capabilities: { icon: React.ReactNode; title: string; subtitle: string }[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const emptyConnectedMap: Record<ConnectorIconId, boolean> = {
  gmail: false,
  'google-calendar': false,
  drive: false,
  'outlook-mail': false,
  'outlook-calendar': false,
};

const connectorConfigs: ConnectorConfig[] = [
  {
    name: 'Gmail',
    icon: 'gmail',
    title: 'Gmail',
    description: 'Connect Gmail to Kivo to understand your inbox intelligently.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Gmail',
    capabilities: [
      { icon: <Eye size={19} />, title: 'View your emails', subtitle: 'Read message metadata and email content you allow.' },
      { icon: <Sparkles size={19} />, title: 'Find important items', subtitle: 'Spot receipts, bills, renewals, and action items.' },
      { icon: <Inbox size={19} />, title: 'Summarize your inbox', subtitle: 'Turn recent emails into useful briefings.' },
    ],
  },
  {
    name: 'Google Calendar',
    icon: 'google-calendar',
    title: 'Google Calendar',
    description: 'Connect Google Calendar so Kivo can understand your schedule.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Calendar',
    capabilities: [
      { icon: <Eye size={19} />, title: 'View your schedule', subtitle: 'See your events and availability.' },
      { icon: <CalendarDays size={19} />, title: 'Find time slots', subtitle: 'Spot free time and scheduling conflicts.' },
      { icon: <Sparkles size={19} />, title: 'Plan your day', subtitle: 'Turn your calendar into useful briefings.' },
    ],
  },
  {
    name: 'Outlook Mail',
    icon: 'outlook-mail',
    title: 'Outlook Mail',
    description: 'Connect Outlook Mail so Kivo can summarize your inbox, detect important messages, and find action items.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Mail',
    capabilities: [
      { icon: <Mail size={19} />, title: 'Read mail context', subtitle: 'Understand messages you allow Kivo to access.' },
      { icon: <Sparkles size={19} />, title: 'Find important messages', subtitle: 'Surface bills, replies, and action items.' },
      { icon: <Inbox size={19} />, title: 'Summarize inbox', subtitle: 'Create useful Outlook briefings.' },
    ],
  },
  {
    name: 'Outlook Calendar',
    icon: 'outlook-calendar',
    title: 'Outlook Calendar',
    description: 'Connect Outlook Calendar so Kivo can understand your Microsoft schedule and plan your day.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Calendar',
    capabilities: [
      { icon: <CalendarDays size={19} />, title: 'View events', subtitle: 'Understand your Microsoft calendar schedule.' },
      { icon: <Search size={19} />, title: 'Find availability', subtitle: 'Spot free time and scheduling conflicts.' },
      { icon: <Sparkles size={19} />, title: 'Plan smarter', subtitle: 'Turn calendar context into helpful plans.' },
    ],
  },
  {
    name: 'Google Drive',
    icon: 'drive',
    title: 'Google Drive',
    description: 'Connect Google Drive so Kivo can help find and summarize your files.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Drive',
    capabilities: [
      { icon: <Search size={19} />, title: 'Find files', subtitle: 'Search your Drive when you ask.' },
      { icon: <FileText size={19} />, title: 'Understand documents', subtitle: 'Summarize docs, notes, and file context.' },
      { icon: <Sparkles size={19} />, title: 'Create briefings', subtitle: 'Turn files into summaries and next steps.' },
    ],
  },
];

const statusEndpoints: Record<ConnectorIconId, (userId: string) => string> = {
  gmail: (userId) => `/api/integrations/google/gmail/status?userId=${encodeURIComponent(userId)}`,
  'google-calendar': (userId) => `/api/integrations/google/calendar/status?userId=${encodeURIComponent(userId)}`,
  drive: (userId) => `/api/integrations/google/drive/status?userId=${encodeURIComponent(userId)}`,
  'outlook-mail': (userId) => `/api/integrations/microsoft/outlook-mail/status?userId=${encodeURIComponent(userId)}`,
  'outlook-calendar': (userId) => `/api/integrations/microsoft/outlook-calendar/status?userId=${encodeURIComponent(userId)}`,
};

function isMicrosoftConnector(icon: ConnectorIconId) {
  return icon === 'outlook-mail' || icon === 'outlook-calendar';
}

function BrandIcon({ icon, large = false }: { icon: ConnectorIconId; large?: boolean }) {
  const size = large ? 'h-[42px] w-[42px]' : 'h-[32px] w-[32px]';
  const base = `${size} flex items-center justify-center overflow-hidden rounded-[8px]`;

  if (icon === 'gmail') {
    return (
      <span className={`${base} bg-white`}>
        <svg viewBox="0 0 48 48" className="h-[26px] w-[26px]" aria-hidden="true">
          <path fill="#4285F4" d="M43 37H34V20.8L24 28.3 14 20.8V37H5V11h6.2L24 20.6 36.8 11H43v26Z" />
          <path fill="#34A853" d="M5 11h6.2L24 20.6v7.7L5 14.1V11Z" />
          <path fill="#FBBC04" d="M43 11v3.1L24 28.3v-7.7L36.8 11H43Z" />
          <path fill="#EA4335" d="M5 14.1 14 20.8V37H5V14.1Zm38 0V37h-9V20.8l9-6.7Z" />
        </svg>
      </span>
    );
  }

  if (icon === 'google-calendar') {
    return (
      <span className={`${base} bg-white`}>
        <svg viewBox="0 0 48 48" className="h-[27px] w-[27px]" aria-hidden="true">
          <path fill="#4285F4" d="M10 10h28v28H10z" />
          <path fill="#34A853" d="M10 29h28v9H10z" />
          <path fill="#FBBC04" d="M10 20h28v9H10z" />
          <path fill="#EA4335" d="M10 10h28v10H10z" />
          <path fill="#fff" d="M14 15h20v19H14z" />
          <text x="24" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4285F4">31</text>
        </svg>
      </span>
    );
  }

  if (icon === 'drive') return <span className={`${base} text-[20px]`}>△</span>;

  if (icon === 'outlook-mail') {
    return (
      <span className={`${base} bg-white`}>
        <span className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] bg-[#0a63d8] text-[12px] font-bold text-white">O</span>
      </span>
    );
  }

  return (
    <span className={`${base} bg-white`}>
      <span className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] bg-[#22a8e8] text-[15px] font-bold text-white">▦</span>
    </span>
  );
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(null);
  const [gmailDetailOpen, setGmailDetailOpen] = useState(false);
  const [calendarDetailOpen, setCalendarDetailOpen] = useState(false);
  const [connectedMap, setConnectedMap] = useState<Record<ConnectorIconId, boolean>>(emptyConnectedMap);
  const [loadingStatusMap, setLoadingStatusMap] = useState<Partial<Record<ConnectorIconId, boolean>>>({});

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    setSelectedConnector(null);
    setGmailDetailOpen(false);
    setCalendarDetailOpen(false);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function syncStatuses() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId || cancelled) return;

      const icons = connectorConfigs.map((connector) => connector.icon);
      setLoadingStatusMap(Object.fromEntries(icons.map((icon) => [icon, true])) as Partial<Record<ConnectorIconId, boolean>>);

      const results = await Promise.all(
        icons.map(async (icon) => {
          try {
            const response = await fetch(statusEndpoints[icon](userId), { cache: 'no-store' });
            if (!response.ok) return [icon, false] as const;
            const payload = await response.json();
            return [icon, Boolean(payload.connected)] as const;
          } catch {
            return [icon, false] as const;
          }
        }),
      );

      if (cancelled) return;
      setConnectedMap((current) => ({ ...current, ...Object.fromEntries(results) } as Record<ConnectorIconId, boolean>));
      setLoadingStatusMap({});
    }

    syncStatuses();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
    setSelectedConnector(null);
    setGmailDetailOpen(false);
    setCalendarDetailOpen(false);
    window.setTimeout(onClose, 160);
  }

  function openConnector(connector: ConnectorConfig) {
    if (connector.icon === 'gmail') {
      setGmailDetailOpen(true);
      return;
    }
    if (connector.icon === 'google-calendar') {
      setCalendarDetailOpen(true);
      return;
    }
    setSelectedConnector(connector);
  }

  async function connectConnector(connector: ConnectorConfig) {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    if (connector.icon === 'drive') {
      window.location.href = `/api/integrations/google/drive/connect?userId=${encodeURIComponent(userId)}`;
      return;
    }

    if (isMicrosoftConnector(connector.icon)) {
      window.location.href = `/api/integrations/microsoft/connect?userId=${encodeURIComponent(userId)}`;
      return;
    }
  }

  async function disconnectConnector(connector: ConnectorConfig) {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    if (connector.icon === 'drive') {
      const response = await fetch('/api/integrations/google/drive/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) return;
      setConnectedMap((current) => ({ ...current, drive: false }));
      return;
    }

    if (isMicrosoftConnector(connector.icon)) {
      const response = await fetch('/api/integrations/microsoft/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) return;
      setConnectedMap((current) => ({ ...current, 'outlook-mail': false, 'outlook-calendar': false }));
    }
  }

  return (
    <div className="fixed inset-0 z-[95] pointer-events-none">
      <button type="button" aria-label="Close connectors" onClick={closeWithAnimation} className={`absolute inset-0 pointer-events-auto bg-white/0 backdrop-blur-[0px] transition duration-160 ${isVisible ? 'backdrop-blur-[1.5px]' : ''}`} />

      <div className={`absolute inset-x-0 bottom-[116px] mx-auto w-[332px] max-w-[calc(100vw-48px)] origin-bottom pointer-events-auto transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[12px] scale-[0.965] opacity-0'}`}>
        <div className="relative overflow-visible">
          <div className="absolute left-1/2 bottom-[-14px] h-[28px] w-[28px] -translate-x-1/2 rotate-45 rounded-[5px] bg-white/94 ring-1 ring-black/[0.018]" />

          <div className="relative max-h-[61vh] overflow-hidden rounded-[24px] bg-white/94 shadow-[0_18px_54px_rgba(15,23,42,0.075)] ring-1 ring-black/[0.03] backdrop-blur-2xl">
            <div className="px-[22px] pb-[16px] pt-[22px]">
              <header className="relative pr-[44px]">
                <button type="button" onClick={closeWithAnimation} aria-label="Close" className="absolute right-0 top-[-3px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f2f2f3] text-[#111] transition active:scale-[0.96]"><X size={21} strokeWidth={2.1} /></button>
                <h2 className="text-[23px] font-semibold leading-none tracking-[-0.055em] text-[#111114]">Connectors</h2>
                <p className="mt-[16px] max-w-[250px] text-[13.5px] leading-[1.35] tracking-[-0.025em] text-[#686971]">Connect your apps and services to give Kivo access to your data and tools.</p>
              </header>

              <div className="mt-[22px] grid grid-cols-2 gap-[10px]">
                <button type="button" className="relative min-h-[116px] rounded-[17px] border border-black/[0.055] bg-white p-[13px] text-left shadow-[0_10px_26px_rgba(15,23,42,0.018)] transition active:scale-[0.99]">
                  <span className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#f2f2f3] text-[#1f2023]"><Plus size={23} strokeWidth={2.1} /></span>
                  <ChevronRight size={21} strokeWidth={2.2} className="absolute right-[12px] top-[24px] text-[#70727a]" />
                  <span className="mt-[25px] block text-[14.5px] font-semibold tracking-[-0.035em] text-[#141518]">Add connector</span>
                  <span className="mt-[8px] block text-[12.5px] leading-[1.3] tracking-[-0.025em] text-[#686971]">Connect a new app or service</span>
                </button>

                <button type="button" className="relative min-h-[116px] rounded-[17px] border border-black/[0.055] bg-white p-[13px] text-left shadow-[0_10px_26px_rgba(15,23,42,0.018)] transition active:scale-[0.99]">
                  <span className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#f2f2f3] text-[#1f2023]"><SlidersHorizontal size={22} strokeWidth={2.1} /></span>
                  <ChevronRight size={21} strokeWidth={2.2} className="absolute right-[12px] top-[24px] text-[#70727a]" />
                  <span className="mt-[25px] block text-[14.5px] font-semibold tracking-[-0.035em] text-[#141518]">Manage connectors</span>
                  <span className="mt-[8px] block text-[12.5px] leading-[1.3] tracking-[-0.025em] text-[#686971]">View and edit your connections</span>
                </button>
              </div>
            </div>

            <section className="px-[22px] pb-[18px]">
              <h3 className="mb-[10px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7b7d85]">Available connectors</h3>
              <div className="max-h-[236px] space-y-[8px] overflow-y-auto pr-[1px] [-webkit-overflow-scrolling:touch]">
                {connectorConfigs.map((connector) => {
                  const connected = connectedMap[connector.icon];
                  const loadingStatus = loadingStatusMap[connector.icon];
                  return (
                    <button key={connector.name} type="button" onClick={() => openConnector(connector)} className="flex min-h-[54px] w-full items-center gap-[12px] rounded-[15px] border border-black/[0.055] bg-white px-[11px] py-[8px] text-left shadow-[0_8px_22px_rgba(15,23,42,0.016)] transition active:scale-[0.992]">
                      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center"><BrandIcon icon={connector.icon} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold tracking-[-0.035em] text-[#141518]">{connector.name}</span>
                        <span className="mt-[2px] block truncate text-[11.5px] leading-[1.2] tracking-[-0.02em] text-[#686971]">{connector.icon === 'gmail' ? 'Access your email, ...' : connector.icon === 'google-calendar' ? 'See events and ma...' : connector.icon === 'outlook-mail' ? 'Connect your Outlook e...' : connector.icon === 'outlook-calendar' ? 'Sync and manage your O...' : connector.icon === 'drive' ? 'Search and access files' : 'Connect your data'}</span>
                      </span>
                      <span className={`flex h-[31px] min-w-[82px] items-center justify-center rounded-[12px] px-[10px] text-[12px] font-semibold tracking-[-0.025em] ${connected ? 'bg-[#f2f2f4] text-[#313238]' : 'border border-black/[0.1] bg-white text-[#141518]'}`}>
                        {loadingStatus ? 'Checking' : connected ? <span className="flex items-center gap-[5px]"><Check size={13} strokeWidth={2.1} /> Connected</span> : 'Connect'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {selectedConnector ? <KivoConnectorDetail open onBack={() => setSelectedConnector(null)} onClose={closeWithAnimation} icon={<BrandIcon icon={selectedConnector.icon} large />} title={selectedConnector.title} description={selectedConnector.description} connectorType={selectedConnector.connectorType} author={selectedConnector.author} buttonLabel={selectedConnector.buttonLabel} capabilities={selectedConnector.capabilities} isConnected={connectedMap[selectedConnector.icon]} onConnect={() => { void connectConnector(selectedConnector); }} onDisconnect={() => { void disconnectConnector(selectedConnector); setSelectedConnector(null); }} /> : null}
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
