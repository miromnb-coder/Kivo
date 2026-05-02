'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Eye, FileText, Inbox, Mail, Plus, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
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

const connectorConfigs: ConnectorConfig[] = [
  {
    name: 'Gmail',
    icon: 'gmail',
    title: 'Gmail',
    description: 'Connect Gmail to Kivo to understand your inbox intelligently. See important emails, find receipts, and keep your tasks on track.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Gmail',
    capabilities: [
      { icon: <Eye size={19} strokeWidth={2.1} />, title: 'View your emails', subtitle: 'Read message metadata and email content you allow.' },
      { icon: <Sparkles size={19} strokeWidth={2.1} />, title: 'Find important items', subtitle: 'Spot receipts, bills, renewals, and action items.' },
      { icon: <Inbox size={19} strokeWidth={2.1} />, title: 'Summarize your inbox', subtitle: 'Turn recent emails into clear, useful briefings.' },
    ],
  },
  {
    name: 'Google Calendar',
    icon: 'google-calendar',
    title: 'Google Calendar',
    description: 'Connect your calendar to Kivo to manage your schedule intelligently. See your events, find the best time for tasks, and keep your day on track.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Calendar',
    capabilities: [
      { icon: <Eye size={19} strokeWidth={2.1} />, title: 'View your schedule', subtitle: 'See your events, calendars, and availability.' },
      { icon: <CalendarDays size={19} strokeWidth={2.1} />, title: 'Find better time slots', subtitle: 'Spot free time and suggest when to focus.' },
      { icon: <Sparkles size={19} strokeWidth={2.1} />, title: 'Plan your day', subtitle: 'Turn your calendar into useful daily briefings.' },
    ],
  },
  {
    name: 'Outlook Mail',
    icon: 'outlook-mail',
    title: 'Outlook Mail',
    description: 'Connect Outlook Mail so Kivo can help understand your Microsoft inbox, surface important messages, and summarize email context.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Mail',
    capabilities: [
      { icon: <Mail size={19} strokeWidth={2.1} />, title: 'Read mail context', subtitle: 'Understand messages you allow Kivo to access.' },
      { icon: <Sparkles size={19} strokeWidth={2.1} />, title: 'Find important messages', subtitle: 'Surface bills, replies, and action items.' },
      { icon: <Inbox size={19} strokeWidth={2.1} />, title: 'Summarize inbox', subtitle: 'Create useful email briefings.' },
    ],
  },
  {
    name: 'Outlook Calendar',
    icon: 'outlook-calendar',
    title: 'Outlook Calendar',
    description: 'Connect Outlook Calendar so Kivo can help understand your Microsoft schedule, events, availability, and daily planning.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Calendar',
    capabilities: [
      { icon: <CalendarDays size={19} strokeWidth={2.1} />, title: 'View events', subtitle: 'Understand your Microsoft calendar schedule.' },
      { icon: <Search size={19} strokeWidth={2.1} />, title: 'Find availability', subtitle: 'Spot free time and scheduling conflicts.' },
      { icon: <Sparkles size={19} strokeWidth={2.1} />, title: 'Plan smarter', subtitle: 'Turn calendar context into helpful plans.' },
    ],
  },
  {
    name: 'Google Drive',
    icon: 'drive',
    title: 'Google Drive',
    description: 'Connect Google Drive so Kivo can help find, understand, and summarize your files and documents when you ask.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Drive',
    capabilities: [
      { icon: <Search size={19} strokeWidth={2.1} />, title: 'Find files', subtitle: 'Search your Drive when you ask.' },
      { icon: <FileText size={19} strokeWidth={2.1} />, title: 'Understand documents', subtitle: 'Summarize docs, notes, and file context.' },
      { icon: <Sparkles size={19} strokeWidth={2.1} />, title: 'Create useful briefings', subtitle: 'Turn files into clear summaries and next steps.' },
    ],
  },
];

const STORAGE_KEY = 'kivo.connector-ui-state.v1';
const MEDIUM_HEIGHT = 0.92;
const emptyConnectedMap: Record<ConnectorIconId, boolean> = { gmail: false, 'google-calendar': false, drive: false, 'outlook-mail': false, 'outlook-calendar': false };
const defaultEnabledMap: Record<ConnectorIconId, boolean> = { gmail: true, 'google-calendar': true, drive: true, 'outlook-mail': true, 'outlook-calendar': true };
const statusEndpoints: Partial<Record<ConnectorIconId, (userId: string) => string>> = {
  gmail: (userId) => `/api/integrations/google/gmail/status?userId=${encodeURIComponent(userId)}`,
  'google-calendar': (userId) => `/api/integrations/google/calendar/status?userId=${encodeURIComponent(userId)}`,
  drive: (userId) => `/api/integrations/google/drive/status?userId=${encodeURIComponent(userId)}`,
  'outlook-mail': (userId) => `/api/integrations/microsoft/outlook-mail/status?userId=${encodeURIComponent(userId)}`,
  'outlook-calendar': (userId) => `/api/integrations/microsoft/outlook-calendar/status?userId=${encodeURIComponent(userId)}`,
};
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function GmailIcon() {
  return <svg width="28" height="22" viewBox="0 0 256 193" fill="none" aria-hidden="true"><path fill="#4285F4" d="M58.18 192.05V93.14L27.1 64.64 0 49.43v125.41c0 9.5 7.7 17.21 17.21 17.21h40.97Z" /><path fill="#34A853" d="M197.82 192.05h40.97c9.5 0 17.21-7.7 17.21-17.21V49.43l-30.69 17.54-27.49 26.17v98.91Z" /><path fill="#EA4335" d="M58.18 93.14 53.95 54.2l4.23-37.29L128 69.27l69.82-52.36 4.67 35.28-4.67 40.95L128 145.5 58.18 93.14Z" /><path fill="#FBBC04" d="M197.82 16.91v76.23L256 49.43V25.52c0-21.25-24.26-33.36-41.22-20.61l-16.96 12Z" /><path fill="#C5221F" d="M0 49.43 26.75 69.5l31.43 23.64V16.91L41.22 4.91C24.26-7.84 0 4.27 0 25.52v23.91Z" /></svg>;
}
function GoogleCalendarIcon() {
  return <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="3" fill="#fff" /><path fill="#EA4335" d="M11 6h26a3 3 0 0 1 3 3v7H8V9a3 3 0 0 1 3-3Z" /><path fill="#4285F4" d="M8 16h8v26h-5a3 3 0 0 1-3-3V16Z" /><path fill="#34A853" d="M32 16h8v23a3 3 0 0 1-3 3h-5V16Z" /><path fill="#FBBC04" d="M16 34h16v8H16v-8Z" /><path fill="#fff" d="M16 16h16v18H16V16Z" /><text x="24" y="29.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#4285F4" fontFamily="Arial, Helvetica, sans-serif">31</text></svg>;
}
function DriveIcon() {
  return <svg width="29" height="26" viewBox="0 0 64 56" fill="none" aria-hidden="true"><path fill="#1E8E3E" d="M23.2 2h17.6L64 42.2H46.4L23.2 2Z" /><path fill="#F9AB00" d="M40.8 2 64 42.2H46.4L23.2 2h17.6Z" /><path fill="#34A853" d="M23.2 2 0 42.2l8.8 15.2L32 17.2 23.2 2Z" /><path fill="#4285F4" d="M8.8 57.4h46.4L64 42.2H17.6L8.8 57.4Z" /></svg>;
}
function OutlookMailIcon() {
  return <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true"><defs><linearGradient id="outlookMailBack" x1="30" y1="13" x2="58" y2="50" gradientUnits="userSpaceOnUse"><stop stopColor="#47D3FF" /><stop offset="1" stopColor="#0A63D8" /></linearGradient><linearGradient id="outlookMailFront" x1="7" y1="18" x2="30" y2="50" gradientUnits="userSpaceOnUse"><stop stopColor="#32A8FF" /><stop offset="1" stopColor="#0057C2" /></linearGradient></defs><rect x="25" y="14" width="34" height="36" rx="4" fill="url(#outlookMailBack)" /><path d="M25 24 42 35l17-11v22a4 4 0 0 1-4 4H25V24Z" fill="#0A5EBE" opacity=".55" /><path d="M5 19.5 31 14v38L5 46.5v-27Z" fill="url(#outlookMailFront)" /><path fill="#fff" d="M10.5 32c0-6.5 3.7-10.6 9.05-10.6 5.4 0 8.9 4 8.9 10.4 0 6.55-3.6 10.75-9 10.75-5.35 0-8.95-4.1-8.95-10.55Zm5.65-.05c0 3.55 1.17 5.7 3.35 5.7 2.15 0 3.3-2.15 3.3-5.7 0-3.48-1.15-5.58-3.3-5.58-2.18 0-3.35 2.1-3.35 5.58Z" /></svg>;
}
function OutlookCalendarIcon() {
  return <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true"><defs><linearGradient id="outlookCalendarIcon" x1="8" y1="10" x2="56" y2="56" gradientUnits="userSpaceOnUse"><stop stopColor="#37C8FF" /><stop offset="1" stopColor="#0A63D8" /></linearGradient></defs><rect x="8" y="11" width="48" height="43" rx="7" fill="url(#outlookCalendarIcon)" /><path fill="#D7F4FF" d="M18 28h6v6h-6v-6Zm11 0h6v6h-6v-6Zm11 0h6v6h-6v-6ZM18 39h6v6h-6v-6Zm11 0h6v6h-6v-6Zm11 0h6v6h-6v-6Z" /><path fill="#B9EEFF" d="M15 20h34v3H15v-3Z" opacity=".9" /></svg>;
}
function BrandIcon({ icon, large = false }: { icon: ConnectorIconId; large?: boolean }) {
  return <span className={`flex h-full w-full items-center justify-center ${large ? 'scale-[1.55]' : ''}`}>{icon === 'gmail' ? <GmailIcon /> : icon === 'google-calendar' ? <GoogleCalendarIcon /> : icon === 'drive' ? <DriveIcon /> : icon === 'outlook-mail' ? <OutlookMailIcon /> : <OutlookCalendarIcon />}</span>;
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(null);
  const [gmailDetailOpen, setGmailDetailOpen] = useState(false);
  const [calendarDetailOpen, setCalendarDetailOpen] = useState(false);
  const [connectedMap, setConnectedMap] = useState<Record<ConnectorIconId, boolean>>(emptyConnectedMap);
  const [enabledMap, setEnabledMap] = useState<Record<ConnectorIconId, boolean>>(defaultEnabledMap);
  const [loadingStatusMap, setLoadingStatusMap] = useState<Partial<Record<ConnectorIconId, boolean>>>({});
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { connectedMap?: Partial<Record<ConnectorIconId, boolean>>; enabledMap?: Partial<Record<ConnectorIconId, boolean>> };
        setConnectedMap({ ...emptyConnectedMap, ...parsed.connectedMap });
        setEnabledMap({ ...defaultEnabledMap, ...parsed.enabledMap });
      }
    } catch {
      setConnectedMap(emptyConnectedMap);
      setEnabledMap(defaultEnabledMap);
    }
    setHasLoadedStoredState(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredState) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ connectedMap, enabledMap }));
  }, [connectedMap, enabledMap, hasLoadedStoredState]);

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
    if (!open || !hasLoadedStoredState) return;
    let cancelled = false;

    async function readStatus(icon: ConnectorIconId, userId: string) {
      const endpoint = statusEndpoints[icon];
      if (!endpoint) return null;

      try {
        const response = await fetch(endpoint(userId), { cache: 'no-store' });
        if (!response.ok) return null;
        const payload = await response.json();
        return Boolean(payload.connected);
      } catch {
        return null;
      }
    }

    async function syncConnectorStatuses() {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        if (!userId || cancelled) return;

        const icons = connectorConfigs.map((connector) => connector.icon);
        setLoadingStatusMap(Object.fromEntries(icons.map((icon) => [icon, true])) as Partial<Record<ConnectorIconId, boolean>>);

        const results = await Promise.all(
          icons.map(async (icon) => [icon, await readStatus(icon, userId)] as const),
        );

        if (cancelled) return;

        setConnectedMap((current) => {
          const next = { ...current };
          for (const [icon, connected] of results) {
            if (connected !== null) next[icon] = connected;
          }
          return next;
        });

        setEnabledMap((current) => {
          const next = { ...current };
          for (const [icon, connected] of results) {
            if (connected === false) next[icon] = false;
            if (connected === true && next[icon] === undefined) next[icon] = true;
          }
          return next;
        });
      } finally {
        if (!cancelled) setLoadingStatusMap({});
      }
    }

    syncConnectorStatuses();

    return () => {
      cancelled = true;
    };
  }, [open, hasLoadedStoredState]);

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

  function connectConnector(connector: ConnectorConfig) {
    setConnectedMap((current) => ({ ...current, [connector.icon]: true }));
    setEnabledMap((current) => ({ ...current, [connector.icon]: true }));
  }

  function disconnectConnector(connector: ConnectorConfig) {
    setConnectedMap((current) => ({ ...current, [connector.icon]: false }));
    setEnabledMap((current) => ({ ...current, [connector.icon]: false }));
  }

  return (
    <div className="fixed inset-0 z-[95]">
      <button type="button" aria-label="Close connectors" onClick={closeWithAnimation} className={`absolute inset-0 bg-black/20 backdrop-blur-[3px] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
      <div ref={sheetRef} className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc] shadow-[0_-16px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-[110px]'}`} style={{ height: `${MEDIUM_HEIGHT * 100}vh` }}>
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
                      <span className="mt-[3px] block truncate text-[13.5px] leading-[1.25] tracking-[-0.025em] text-[#65666e]">{connector.icon === 'gmail' ? 'Access your email, labels and messages' : connector.icon === 'google-calendar' ? 'See events and manage your schedule' : connector.icon === 'outlook-mail' ? 'Connect your Outlook email account' : connector.icon === 'outlook-calendar' ? 'Sync and manage your Outlook events' : 'Search and access your files'}</span>
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

      {selectedConnector ? <KivoConnectorDetail open onBack={() => setSelectedConnector(null)} onClose={closeWithAnimation} icon={<BrandIcon icon={selectedConnector.icon} large />} title={selectedConnector.title} description={selectedConnector.description} connectorType={selectedConnector.connectorType} author={selectedConnector.author} buttonLabel={selectedConnector.buttonLabel} capabilities={selectedConnector.capabilities} isConnected={connectedMap[selectedConnector.icon]} onConnect={() => { connectConnector(selectedConnector); setSelectedConnector(null); }} onDisconnect={() => { disconnectConnector(selectedConnector); setSelectedConnector(null); }} /> : null}
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
