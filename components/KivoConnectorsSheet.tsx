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
  const base = `${size} flex items-center justify-center rounded-[9px] font-bold`;
  if (icon === 'gmail') return <span className={`${base} text-[22px]`}>M</span>;
  if (icon === 'google-calendar') return <span className={`${base} bg-white text-[18px]`}>31</span>;
  if (icon === 'drive') return <span className={`${base} text-[20px]`}>△</span>;
  if (icon === 'outlook-mail') return <span className={`${base} bg-[#0a63d8] text-[12px] text-white`}>O</span>;
  return <span className={`${base} bg-[#22a8e8] text-[17px] text-white`}>▦</span>;
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
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
    };
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
    window.setTimeout(onClose, 180);
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
    <div className="fixed inset-0 z-[95]">
      <button type="button" aria-label="Close connectors" onClick={closeWithAnimation} className={`absolute inset-0 bg-black/20 backdrop-blur-[3px] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute inset-x-0 bottom-0 mx-auto h-[92vh] w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc] shadow-[0_-16px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-[110px]'}`}>
        <div className="h-full overflow-y-auto px-[22px] pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[28px] [-webkit-overflow-scrolling:touch]">
          <header className="relative pr-[58px]">
            <button type="button" onClick={closeWithAnimation} aria-label="Close" className="absolute right-0 top-0 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f0f0f1] text-[#111] transition active:scale-[0.96]"><X size={22} strokeWidth={2.1} /></button>
            <h2 className="text-[31px] font-semibold leading-none tracking-[-0.055em] text-[#111114]">Connectors</h2>
            <p className="mt-[20px] max-w-[340px] text-[18px] leading-[1.42] tracking-[-0.035em] text-[#5f6067]">Connect your apps and services to give Kivo access to your data and tools.</p>
          </header>

          <div className="mt-[32px] grid grid-cols-2 gap-[14px]">
            <button type="button" className="relative min-h-[136px] rounded-[20px] border border-black/[0.055] bg-white p-[16px] text-left shadow-[0_12px_34px_rgba(15,23,42,0.025)] transition active:scale-[0.99]">
              <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px] bg-[#f2f2f3] text-[#1f2023]"><Plus size={25} strokeWidth={2.1} /></span>
              <ChevronRight size={23} strokeWidth={2.2} className="absolute right-[14px] top-[25px] text-[#44454a]" />
              <span className="mt-[28px] block text-[18px] font-semibold tracking-[-0.035em] text-[#141518]">Add connector</span>
              <span className="mt-[10px] block text-[16px] leading-[1.25] tracking-[-0.035em] text-[#686971]">Connect a new app or service</span>
            </button>

            <button type="button" className="relative min-h-[136px] rounded-[20px] border border-black/[0.055] bg-white p-[16px] text-left shadow-[0_12px_34px_rgba(15,23,42,0.025)] transition active:scale-[0.99]">
              <span className="flex h-[44px] w-[44px] items-center justify-center rounded-[13px] bg-[#f2f2f3] text-[#1f2023]"><SlidersHorizontal size={24} strokeWidth={2.1} /></span>
              <ChevronRight size={23} strokeWidth={2.2} className="absolute right-[14px] top-[25px] text-[#44454a]" />
              <span className="mt-[28px] block text-[18px] font-semibold tracking-[-0.035em] text-[#141518]">Manage connectors</span>
              <span className="mt-[10px] block text-[16px] leading-[1.25] tracking-[-0.035em] text-[#686971]">View and edit your connections</span>
            </button>
          </div>

          <section className="mt-[32px]">
            <h3 className="mb-[14px] text-[13px] font-semibold uppercase tracking-[0.06em] text-[#696a72]">Available connectors</h3>
            <div className="space-y-[10px]">
              {connectorConfigs.map((connector) => {
                const connected = connectedMap[connector.icon];
                const loadingStatus = loadingStatusMap[connector.icon];
                return (
                  <button key={connector.name} type="button" onClick={() => openConnector(connector)} className="flex min-h-[72px] w-full items-center gap-[14px] rounded-[18px] border border-black/[0.055] bg-white px-[14px] py-[12px] text-left shadow-[0_10px_30px_rgba(15,23,42,0.02)] transition active:scale-[0.992]">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center"><BrandIcon icon={connector.icon} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-semibold tracking-[-0.035em] text-[#141518]">{connector.name}</span>
                      <span className="mt-[3px] block truncate text-[13.5px] leading-[1.25] tracking-[-0.025em] text-[#65666e]">{connector.icon === 'gmail' ? 'Access your email, labels and messages' : connector.icon === 'google-calendar' ? 'See events and manage your schedule' : connector.icon === 'outlook-mail' ? 'Connect your Outlook email account' : connector.icon === 'outlook-calendar' ? 'Sync and manage your Outlook events' : connector.icon === 'drive' ? 'Search and access your files' : 'Connect your data'}</span>
                    </span>
                    <span className={`flex h-[34px] min-w-[82px] items-center justify-center rounded-[10px] border px-[14px] text-[14px] font-semibold tracking-[-0.025em] ${connected ? 'border-[#d9dadd] bg-[#f4f4f5] text-[#5f6067]' : 'border-black/[0.12] bg-white text-[#141518]'}`}>
                      {loadingStatus ? 'Checking' : connected ? <span className="flex items-center gap-[5px]"><Check size={15} strokeWidth={2.1} /> Connected</span> : 'Connect'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {selectedConnector ? <KivoConnectorDetail open onBack={() => setSelectedConnector(null)} onClose={closeWithAnimation} icon={<BrandIcon icon={selectedConnector.icon} large />} title={selectedConnector.title} description={selectedConnector.description} connectorType={selectedConnector.connectorType} author={selectedConnector.author} buttonLabel={selectedConnector.buttonLabel} capabilities={selectedConnector.capabilities} isConnected={connectedMap[selectedConnector.icon]} onConnect={() => { void connectConnector(selectedConnector); }} onDisconnect={() => { void disconnectConnector(selectedConnector); setSelectedConnector(null); }} /> : null}
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
