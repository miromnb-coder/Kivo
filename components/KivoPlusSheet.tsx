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

type KivoPlusSheetProps = {
  open: boolean;
  onClose: () => void;
};

type ActionItem = {
  title: string;
  icon: ReactNode;
  badge?: string;
};

type ConnectorItem = {
  title: string;
  iconSrc: string;
  description: string;
  category: string;
  features: string;
};

const actions: ActionItem[] = [
  { title: 'Add files', icon: <FolderPlus size={24} strokeWidth={1.75} /> },
  { title: 'Create image', icon: <Pencil size={24} strokeWidth={1.75} /> },
  { title: 'Write draft', icon: <FilePenLine size={24} strokeWidth={1.75} /> },
  { title: 'Research deeply', icon: <Globe2 size={24} strokeWidth={1.75} />, badge: '5 left' },
  { title: 'Schedule task', icon: <CalendarDays size={24} strokeWidth={1.75} /> },
  { title: 'Connect tools', icon: <Plug size={24} strokeWidth={1.75} /> },
];

const connectors: ConnectorItem[] = [
  {
    title: 'Google Drive',
    iconSrc: '/connectors/google-drive.PNG',
    description: 'Connect Google Drive to Kivo to find files, summarize documents, analyze folders, and use your workspace content in conversations.',
    category: 'Productivity',
    features: 'File search',
  },
  {
    title: 'Gmail',
    iconSrc: '/connectors/gmail.PNG',
    description: 'Connect Gmail to Kivo to summarize conversations, draft replies, surface recent threads, prepare meeting context, and highlight action items.',
    category: 'Productivity',
    features: 'Email assistance',
  },
  {
    title: 'Google Calendar',
    iconSrc: '/connectors/google-calendar.PNG',
    description: 'Connect Google Calendar to Kivo to understand your schedule, plan your day, prepare for meetings, and create smarter reminders.',
    category: 'Productivity',
    features: 'Calendar planning',
  },
  {
    title: 'Outlook Calendar',
    iconSrc: '/connectors/outlook-calendar.PNG',
    description: 'Connect Outlook Calendar to Kivo to organize upcoming events, prepare meeting context, find open time, and keep your day on track.',
    category: 'Productivity',
    features: 'Calendar planning',
  },
  {
    title: 'Outlook Mail',
    iconSrc: '/connectors/outlook-mail.PNG',
    description: 'Connect Outlook Mail to Kivo to summarize emails, draft responses, find important messages, and turn conversations into clear next steps.',
    category: 'Productivity',
    features: 'Email assistance',
  },
];

function EmptyPreviewTile({ large = false }: { large?: boolean }) {
  return (
    <button
      type="button"
      className={`flex shrink-0 items-center justify-center rounded-[20px] border border-black/[0.04] bg-[#f8f8f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] ${
        large ? 'h-[98px] w-[98px]' : 'h-[98px] w-[112px]'
      }`}
    >
      {large ? <Camera size={38} strokeWidth={2.15} className="text-[#5a5a5e]" /> : null}
    </button>
  );
}

function ActionRow({ item }: { item: ActionItem }) {
  return (
    <button type="button" className="flex h-[56px] w-full items-center gap-[22px] text-left text-[#17181b] transition active:scale-[0.995]">
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
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
          draggable={false}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center rounded-[7px] bg-[#f1f1f3] font-semibold text-[#777982] ${fallbackClassName}`}>
          {title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

function ConnectorRow({ item, onOpen }: { item: ConnectorItem; onOpen: () => void }) {
  return (
    <div className="flex h-[50px] items-center gap-[18px]">
      <ConnectorIcon src={item.iconSrc} title={item.title} />
      <span className="min-w-0 flex-1 truncate text-[18px] font-normal tracking-[-0.035em] text-[#24252a]">{item.title}</span>
      <button
        type="button"
        onClick={onOpen}
        className="h-[40px] rounded-[20px] bg-white px-[22px] text-[15.5px] font-medium tracking-[-0.03em] text-[#202124] shadow-[0_8px_24px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] transition active:scale-[0.98]"
      >
        Connect
      </button>
    </div>
  );
}

function DetailRow({ label, value, external = false }: { label: string; value?: string; external?: boolean }) {
  return (
    <div className="grid min-h-[64px] grid-cols-[1fr_1fr] items-center border-t border-black/[0.09] px-[20px]">
      <span className="text-[17px] font-normal tracking-[-0.035em] text-[#8b8c92]">{label}</span>
      <span className="flex items-center justify-start text-[17px] font-normal tracking-[-0.035em] text-[#15161a]">
        {external ? <ExternalLink size={18} strokeWidth={2} /> : value}
      </span>
    </div>
  );
}

function ConnectorDetailView({ connector, onBack }: { connector: ConnectorItem; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-white px-[18px] pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+14px)] text-[#111113] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <header className="relative mb-[34px] flex h-[44px] items-center justify-center">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute left-0 flex h-[44px] w-[44px] items-center justify-center text-[#111113] transition active:scale-[0.96]"
        >
          <ChevronLeft size={30} strokeWidth={2.2} />
        </button>
        <h2 className="text-[20px] font-semibold tracking-[-0.04em]">Apps</h2>
        <button
          type="button"
          aria-label="Share"
          className="absolute right-0 flex h-[44px] w-[44px] items-center justify-center text-[#111113] transition active:scale-[0.96]"
        >
          <Share size={26} strokeWidth={2.2} />
        </button>
      </header>

      <section className="mb-[34px] flex items-start gap-[24px]">
        <div className="flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-black/[0.07]">
          <ConnectorIcon
            src={connector.iconSrc}
            title={connector.title}
            className="h-[66px] w-[66px] rounded-[12px]"
            fallbackClassName="text-[24px]"
          />
        </div>

        <div className="min-w-0 pt-[2px]">
          <h1 className="mb-[18px] truncate text-[32px] font-semibold leading-none tracking-[-0.055em] text-[#111113]">
            {connector.title}
          </h1>
          <button
            type="button"
            className="h-[44px] rounded-full bg-black px-[32px] text-[17px] font-medium tracking-[-0.035em] text-white transition active:scale-[0.98]"
          >
            Connect
          </button>
        </div>
      </section>

      <p className="mb-[50px] max-w-[360px] text-[21px] font-normal leading-[1.55] tracking-[-0.045em] text-[#5c5d64]">
        {connector.description}
      </p>

      <section>
        <h3 className="mb-[28px] text-[24px] font-semibold tracking-[-0.05em] text-[#111113]">Details</h3>
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

export function KivoPlusSheet({ open, onClose }: KivoPlusSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    setSelectedConnector(null);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
    setSelectedConnector(null);
    window.setTimeout(onClose, 170);
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden pointer-events-none">
      <button
        type="button"
        aria-label="Close plus menu"
        onClick={closeWithAnimation}
        className="absolute inset-0 pointer-events-auto bg-transparent"
      />

      <section
        aria-label="Kivo actions"
        className={`pointer-events-auto absolute inset-x-0 bottom-0 max-h-[79vh] overflow-y-auto overscroll-contain rounded-t-[38px] bg-[#fbfbfc] px-[24px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[22px] shadow-[0_-18px_58px_rgba(15,23,42,0.07)] ring-1 ring-black/[0.035] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="mx-auto mb-[26px] h-[6px] w-[76px] rounded-full bg-[#c4c4c9]" />

        <div className="-mx-[10px] mb-[36px] flex gap-[18px] overflow-x-auto px-[10px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <EmptyPreviewTile large />
          <EmptyPreviewTile />
          <EmptyPreviewTile />
          <EmptyPreviewTile />
        </div>

        <div className="space-y-[1px]">
          {actions.map((action) => (
            <ActionRow key={action.title} item={action} />
          ))}
        </div>

        <div className="my-[22px] h-px bg-black/[0.1]" />

        <section>
          <h3 className="mb-[12px] text-[19px] font-medium tracking-[-0.04em] text-[#6d6e76]">Connectors</h3>
          <div className="space-y-[8px]">
            {connectors.map((connector) => (
              <ConnectorRow key={connector.title} item={connector} onOpen={() => setSelectedConnector(connector)} />
            ))}
          </div>
        </section>
      </section>

      {selectedConnector ? (
        <ConnectorDetailView connector={selectedConnector} onBack={() => setSelectedConnector(null)} />
      ) : null}
    </div>
  );
}
