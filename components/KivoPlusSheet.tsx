'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ExternalLink,
  FilePenLine,
  FolderPlus,
  Globe2,
  Pencil,
  Plug,
  Share,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useKivoSheetMotion } from './useKivoSheetMotion';

export type ConnectorId = 'google-drive' | 'gmail' | 'google-calendar' | 'outlook-calendar' | 'outlook-mail';

type KivoPlusSheetProps = {
  open: boolean;
  onClose: () => void;
  onAddFiles?: () => void;
  initialConnectorId?: ConnectorId | null;
  onInitialConnectorHandled?: () => void;
};

type ActionItem = {
  title: string;
  icon: ReactNode;
  badge?: string;
  action?: 'add-files';
};

type ConnectorItem = {
  id: ConnectorId;
  title: string;
  iconSrc: string;
  description: string;
  category: string;
  features: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const actions: ActionItem[] = [
  { title: 'Add files', icon: <FolderPlus size={24} strokeWidth={1.75} />, action: 'add-files' },
  { title: 'Create image', icon: <Pencil size={24} strokeWidth={1.75} /> },
  { title: 'Write draft', icon: <FilePenLine size={24} strokeWidth={1.75} /> },
  { title: 'Research deeply', icon: <Globe2 size={24} strokeWidth={1.75} />, badge: '5 left' },
  { title: 'Schedule task', icon: <CalendarDays size={24} strokeWidth={1.75} /> },
  { title: 'Connect tools', icon: <Plug size={24} strokeWidth={1.75} /> },
];

const connectors: ConnectorItem[] = [
  {
    id: 'google-drive',
    title: 'Google Drive',
    iconSrc: '/connectors/google-drive.PNG',
    description: 'Connect Google Drive to Kivo to search files, summarize documents, analyze folders, and use workspace content in conversations.',
    category: 'Productivity',
    features: 'File search',
  },
  {
    id: 'gmail',
    title: 'Gmail',
    iconSrc: '/connectors/gmail.PNG',
    description: 'Connect Gmail to Kivo to summarize conversations, draft replies, surface recent threads, prepare meeting context, and highlight action items.',
    category: 'Productivity',
    features: 'Email assistance',
  },
  {
    id: 'google-calendar',
    title: 'Google Calendar',
    iconSrc: '/connectors/google-calendar.PNG',
    description: 'Connect Google Calendar to Kivo to review your schedule, plan your day, prepare meetings, and create smarter reminders.',
    category: 'Productivity',
    features: 'Calendar planning',
  },
  {
    id: 'outlook-calendar',
    title: 'Outlook Calendar',
    iconSrc: '/connectors/outlook-calendar.PNG',
    description: 'Connect Outlook Calendar to Kivo to organize events, prepare meeting context, find open time, and keep your day on track.',
    category: 'Productivity',
    features: 'Calendar planning',
  },
  {
    id: 'outlook-mail',
    title: 'Outlook Mail',
    iconSrc: '/connectors/outlook-mail.PNG',
    description: 'Connect Outlook Mail to Kivo to summarize emails, draft responses, find important messages, and turn threads into next steps.',
    category: 'Productivity',
    features: 'Email assistance',
  },
];

const emptyConnectedMap: Record<ConnectorId, boolean> = {
  'google-drive': false,
  gmail: false,
  'google-calendar': false,
  'outlook-calendar': false,
  'outlook-mail': false,
};

const statusEndpoints: Record<ConnectorId, (userId: string) => string> = {
  'google-drive': (userId) => `/api/integrations/google/drive/status?userId=${encodeURIComponent(userId)}`,
  gmail: (userId) => `/api/integrations/google/gmail/status?userId=${encodeURIComponent(userId)}`,
  'google-calendar': (userId) => `/api/integrations/google/calendar/status?userId=${encodeURIComponent(userId)}`,
  'outlook-calendar': (userId) => `/api/integrations/microsoft/outlook-calendar/status?userId=${encodeURIComponent(userId)}`,
  'outlook-mail': (userId) => `/api/integrations/microsoft/outlook-mail/status?userId=${encodeURIComponent(userId)}`,
};

const connectEndpoints: Record<ConnectorId, (userId: string) => string> = {
  'google-drive': (userId) => `/api/integrations/google/drive/connect?userId=${encodeURIComponent(userId)}`,
  gmail: (userId) => `/api/integrations/google/gmail/connect?userId=${encodeURIComponent(userId)}`,
  'google-calendar': (userId) => `/api/integrations/google/calendar/connect?userId=${encodeURIComponent(userId)}`,
  'outlook-calendar': (userId) => `/api/integrations/microsoft/connect?userId=${encodeURIComponent(userId)}&connectorId=outlook-calendar`,
  'outlook-mail': (userId) => `/api/integrations/microsoft/connect?userId=${encodeURIComponent(userId)}&connectorId=outlook-mail`,
};

function findConnector(id?: ConnectorId | null) {
  if (!id) return null;
  return connectors.find((connector) => connector.id === id) ?? null;
}

function EmptyPreviewTile({ large = false, onClick }: { large?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-[20px] border border-black/[0.04] bg-[#f8f8f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition active:scale-[0.985] ${
        large ? 'h-[98px] w-[98px]' : 'h-[98px] w-[112px]'
      }`}
    >
      {large ? <Camera size={38} strokeWidth={2.15} className="text-[#5a5a5e]" /> : null}
    </button>
  );
}

function ActionRow({ item, onClick }: { item: ActionItem; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-[56px] w-full items-center gap-[22px] text-left text-[#17181b] transition active:scale-[0.995]">
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[#15161a]">{item.icon}</span>
      <span className="flex min-w-0 flex-1 items-center gap-[12px]">
        <span className="truncate text-[20px] font-normal leading-none tracking-[-0.04em]">{item.title}</span>
        {item.badge ? (
          <span className="shrink-0 rounded-[7px] bg-[#ececf0] px-[9px] py-[3px] text-[13px] font-medium leading-none tracking-[-0.03em] text-[#505157]">
            {item.badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ConnectorIcon({ src, title, className = 'h-[32px] w-[32px]', fallbackClassName = 'text-[12px]' }: { src: string; title: string; className?: string; fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[7px] ${className}`}>
      {!failed ? (
        <img src={src} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} draggable={false} />
      ) : (
        <span className={`flex h-full w-full items-center justify-center rounded-[7px] bg-[#f1f1f3] font-semibold text-[#777982] ${fallbackClassName}`}>{title.slice(0, 1)}</span>
      )}
    </span>
  );
}

function getConnectorButtonLabel(connected?: boolean) {
  return connected ? 'Connected' : 'Connect';
}

function getConnectorDetailButtonLabel(connected: boolean, loading: boolean) {
  if (loading) return connected ? 'Disconnecting…' : 'Connecting…';
  return connected ? 'Disconnect' : 'Connect';
}

function ConnectorRow({ item, onOpen, connected }: { item: ConnectorItem; onOpen: () => void; connected?: boolean }) {
  return (
    <div className="flex h-[50px] items-center gap-[18px]">
      <ConnectorIcon src={item.iconSrc} title={item.title} />
      <span className="min-w-0 flex-1 truncate text-[18px] font-normal tracking-[-0.035em] text-[#24252a]">{item.title}</span>
      <button type="button" onClick={onOpen} className="h-[40px] rounded-[20px] bg-white px-[22px] text-[15.5px] font-medium tracking-[-0.03em] text-[#202124] shadow-[0_8px_24px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] transition active:scale-[0.98]">
        {getConnectorButtonLabel(connected)}
      </button>
    </div>
  );
}

function DetailRow({ label, value, external = false }: { label: string; value?: string; external?: boolean }) {
  return (
    <div className="grid min-h-[54px] grid-cols-[1fr_1fr] items-center border-t border-black/[0.09] px-[20px] first:border-t-0">
      <span className="text-[16px] font-normal tracking-[-0.035em] text-[#8b8c92]">{label}</span>
      <span className="flex items-center justify-start text-[16px] font-normal tracking-[-0.035em] text-[#15161a]">{external ? <ExternalLink size={17} strokeWidth={2} /> : value}</span>
    </div>
  );
}

function ConnectorDetailView({
  connector,
  connected,
  loading,
  errorMessage,
  onBack,
  onPrimaryAction,
}: {
  connector: ConnectorItem;
  connected: boolean;
  loading: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onPrimaryAction: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-white px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[calc(env(safe-area-inset-top)+10px)] text-[#111113]">
      <header className="relative mb-[26px] flex h-[42px] items-center justify-center">
        <button type="button" aria-label="Back" onClick={onBack} className="absolute left-0 flex h-[42px] w-[42px] items-center justify-center text-[#111113] transition active:scale-[0.96]"><ChevronLeft size={29} strokeWidth={2.2} /></button>
        <h2 className="text-[20px] font-semibold tracking-[-0.04em]">Apps</h2>
        <button type="button" aria-label="Share" className="absolute right-0 flex h-[42px] w-[42px] items-center justify-center text-[#111113] transition active:scale-[0.96]"><Share size={25} strokeWidth={2.2} /></button>
      </header>

      <section className="mb-[30px] flex items-start gap-[22px]">
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.07]">
          <ConnectorIcon src={connector.iconSrc} title={connector.title} className="h-[58px] w-[58px] rounded-[12px]" fallbackClassName="text-[22px]" />
        </div>
        <div className="min-w-0 pt-[1px]">
          <h1 className="mb-[16px] truncate text-[31px] font-semibold leading-none tracking-[-0.055em] text-[#111113]">{connector.title}</h1>
          <button
            type="button"
            onClick={onPrimaryAction}
            disabled={loading}
            className="h-[42px] rounded-full bg-black px-[31px] text-[16px] font-medium tracking-[-0.035em] text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {getConnectorDetailButtonLabel(connected, loading)}
          </button>
          {errorMessage ? (
            <p className="mt-[10px] max-w-[220px] text-[13px] font-medium leading-[1.25] tracking-[-0.025em] text-[#d33a32]">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </section>

      <p className="mb-[42px] max-w-[360px] text-[19px] font-normal leading-[1.45] tracking-[-0.045em] text-[#5c5d64]">{connector.description}</p>

      <section>
        <h3 className="mb-[24px] text-[23px] font-semibold tracking-[-0.05em] text-[#111113]">Details</h3>
        <div className="overflow-hidden rounded-[17px] border border-black/[0.1]">
          <DetailRow label="Category" value={connector.category} />
          <DetailRow label="Features" value={connector.features} />
          <DetailRow label="Developer" value="Kivo" />
          <DetailRow label="Website" external />
          <DetailRow label="Privacy Policy" external />
          <DetailRow label="Terms of Service" />
        </div>
      </section>
    </div>
  );
}

export function KivoPlusSheet({ open, onClose, onAddFiles, initialConnectorId = null, onInitialConnectorHandled }: KivoPlusSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);
  const [connectedMap, setConnectedMap] = useState<Record<ConnectorId, boolean>>(emptyConnectedMap);
  const [loadingStatusMap, setLoadingStatusMap] = useState<Partial<Record<ConnectorId, boolean>>>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<Partial<Record<ConnectorId, boolean>>>({});
  const [actionErrorMap, setActionErrorMap] = useState<Partial<Record<ConnectorId, string>>>({});

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    setSelectedConnector(findConnector(initialConnectorId));
    setActionErrorMap({});
    const frame = requestAnimationFrame(() => setIsVisible(true));
    onInitialConnectorHandled?.();
    return () => cancelAnimationFrame(frame);
  }, [open, initialConnectorId, onInitialConnectorHandled]);

  useEffect(() => {
    if (!open || !initialConnectorId) return;
    setSelectedConnector(findConnector(initialConnectorId));
  }, [open, initialConnectorId]);

  async function getCurrentUserId() {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }

  async function syncStatuses() {
    const userId = await getCurrentUserId();
    if (!userId) {
      setConnectedMap(emptyConnectedMap);
      setLoadingStatusMap({});
      return;
    }

    setLoadingStatusMap(Object.fromEntries(connectors.map((connector) => [connector.id, true])) as Partial<Record<ConnectorId, boolean>>);
    const results = await Promise.all(connectors.map(async (connector) => {
      try {
        const response = await fetch(statusEndpoints[connector.id](userId), { cache: 'no-store' });
        if (!response.ok) return [connector.id, false] as const;
        const payload = await response.json();
        return [connector.id, Boolean(payload.connected)] as const;
      } catch {
        return [connector.id, false] as const;
      }
    }));

    setConnectedMap((current) => ({ ...current, ...Object.fromEntries(results) } as Record<ConnectorId, boolean>));
    setLoadingStatusMap({});
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function run() {
      if (cancelled) return;
      await syncStatuses();
    }

    run();
    return () => { cancelled = true; };
  }, [open]);

  function closeWithAnimation() {
    setIsVisible(false);
    setSelectedConnector(null);
    window.setTimeout(onClose, 170);
  }

  function handleAddFiles() {
    onAddFiles?.();
    closeWithAnimation();
  }

  const sheetMotion = useKivoSheetMotion({ visible: isVisible, onClose: closeWithAnimation });

  if (!open) return null;

  async function connectConnector(connector: ConnectorItem) {
    const userId = await getCurrentUserId();
    if (!userId) {
      setActionErrorMap((current) => ({ ...current, [connector.id]: 'Sign in again to connect this app.' }));
      return;
    }

    setActionLoadingMap((current) => ({ ...current, [connector.id]: true }));
    setActionErrorMap((current) => ({ ...current, [connector.id]: '' }));
    window.location.assign(connectEndpoints[connector.id](userId));
  }

  async function disconnectConnector(connector: ConnectorItem) {
    const userId = await getCurrentUserId();
    if (!userId) {
      setActionErrorMap((current) => ({ ...current, [connector.id]: 'Sign in again to disconnect this app.' }));
      return;
    }

    const confirmed = window.confirm(`Disconnect ${connector.title}?`);
    if (!confirmed) return;

    setActionLoadingMap((current) => ({ ...current, [connector.id]: true }));
    setActionErrorMap((current) => ({ ...current, [connector.id]: '' }));

    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, connectorId: connector.id }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Disconnect failed');
      }

      setConnectedMap((current) => ({ ...current, [connector.id]: false }));
      await syncStatuses();
    } catch (error) {
      setActionErrorMap((current) => ({ ...current, [connector.id]: error instanceof Error ? error.message : 'Disconnect failed' }));
    } finally {
      setActionLoadingMap((current) => ({ ...current, [connector.id]: false }));
    }
  }

  async function handleConnectorPrimaryAction(connector: ConnectorItem) {
    if (connectedMap[connector.id]) {
      await disconnectConnector(connector);
      return;
    }

    await connectConnector(connector);
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden pointer-events-none">
      <button type="button" aria-label="Close plus menu" onClick={closeWithAnimation} className="absolute inset-0 pointer-events-auto bg-transparent" />

      <section aria-label="Kivo actions" className={`pointer-events-auto absolute inset-x-0 bottom-0 max-h-[79vh] overflow-y-auto overscroll-contain rounded-t-[38px] bg-[#fbfbfc] px-[24px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[22px] shadow-[0_-18px_58px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.035] transition-[transform,box-shadow] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${sheetMotion.moving ? 'duration-0 ease-linear' : 'duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]'}`} style={sheetMotion.style}>
        <button type="button" aria-label="Move plus menu" {...sheetMotion.handleProps} className="sticky top-[-22px] z-20 -mx-[24px] -mt-[18px] mb-[10px] flex h-[42px] w-[calc(100%+48px)] touch-none items-center justify-center cursor-grab bg-[#fbfbfc]/95 backdrop-blur active:cursor-grabbing">
          <span className="h-[6px] w-[76px] rounded-full bg-[#c4c4c9]" />
        </button>

        <div className="-mx-[10px] mb-[36px] flex gap-[18px] overflow-x-auto px-[10px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <EmptyPreviewTile large onClick={handleAddFiles} />
          <EmptyPreviewTile onClick={handleAddFiles} />
          <EmptyPreviewTile onClick={handleAddFiles} />
          <EmptyPreviewTile onClick={handleAddFiles} />
        </div>

        <div className="space-y-[1px]">
          {actions.map((action) => (
            <ActionRow key={action.title} item={action} onClick={action.action === 'add-files' ? handleAddFiles : undefined} />
          ))}
        </div>

        <div className="my-[22px] h-px bg-black/[0.1]" />

        <section>
          <h3 className="mb-[12px] text-[19px] font-medium tracking-[-0.04em] text-[#6d6e76]">Connectors</h3>
          <div className="space-y-[8px]">
            {connectors.map((connector) => (
              <ConnectorRow key={connector.title} item={connector} connected={connectedMap[connector.id]} onOpen={() => setSelectedConnector(connector)} />
            ))}
          </div>
        </section>
      </section>

      {selectedConnector ? (
        <ConnectorDetailView
          connector={selectedConnector}
          connected={connectedMap[selectedConnector.id]}
          loading={Boolean(loadingStatusMap[selectedConnector.id] || actionLoadingMap[selectedConnector.id])}
          errorMessage={actionErrorMap[selectedConnector.id] || null}
          onBack={() => setSelectedConnector(null)}
          onPrimaryAction={() => { void handleConnectorPrimaryAction(selectedConnector); }}
        />
      ) : null}
    </div>
  );
}
