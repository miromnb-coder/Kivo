'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  Camera,
  FilePenLine,
  FolderPlus,
  Globe2,
  ImageIcon,
  Pencil,
  Plug,
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
  icon: ReactNode;
};

const actions: ActionItem[] = [
  { title: 'Add files', icon: <FolderPlus size={28} strokeWidth={1.75} /> },
  { title: 'Create image', icon: <Pencil size={28} strokeWidth={1.75} /> },
  { title: 'Write draft', icon: <FilePenLine size={28} strokeWidth={1.75} /> },
  { title: 'Research deeply', icon: <Globe2 size={28} strokeWidth={1.75} />, badge: '5 left' },
  { title: 'Schedule task', icon: <CalendarDays size={28} strokeWidth={1.75} /> },
  { title: 'Connect tools', icon: <Plug size={28} strokeWidth={1.75} /> },
];

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[32px] w-[32px]" aria-hidden="true">
      <path fill="#1FA463" d="M18.4 6h11.2l14.1 24.4H32.4L18.4 6Z" />
      <path fill="#FFD04B" d="M18.4 6 4.3 30.4l5.6 9.6L24 15.6 18.4 6Z" />
      <path fill="#4688F1" d="M9.9 40h28.2l5.6-9.6H15.5L9.9 40Z" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[32px] w-[32px]" aria-hidden="true">
      <path fill="#EA4335" d="M6 14.5v22A3.5 3.5 0 0 0 9.5 40H15V21.4L6 14.5Z" />
      <path fill="#34A853" d="M33 40h5.5A3.5 3.5 0 0 0 42 36.5v-22l-9 6.9V40Z" />
      <path fill="#FBBC04" d="M33 14.5 24 21.4l-9-6.9V21.4l9 6.9 9-6.9v-6.9Z" />
      <path fill="#4285F4" d="M15 40h18V21.4l-9 6.9-9-6.9V40Z" opacity=".08" />
      <path fill="#EA4335" d="M6 14.5A3.5 3.5 0 0 1 11.6 11.7L24 21.4l12.4-9.7A3.5 3.5 0 0 1 42 14.5l-18 13.8L6 14.5Z" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[32px] w-[32px]" aria-hidden="true">
      <path fill="#4285F4" d="M8 10h32v30H8V10Z" />
      <path fill="#34A853" d="M8 32h32v8H8v-8Z" />
      <path fill="#FBBC04" d="M8 10h32v8H8v-8Z" />
      <path fill="#EA4335" d="M32 10h8v30h-8V10Z" />
      <path fill="#fff" d="M12 18h20v18H12V18Z" />
      <text x="16" y="32" fontSize="12" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fill="#4285F4">31</text>
    </svg>
  );
}

const connectors: ConnectorItem[] = [
  { title: 'Google Drive', icon: <GoogleDriveIcon /> },
  { title: 'Gmail', icon: <GmailIcon /> },
  { title: 'Google Calendar', icon: <GoogleCalendarIcon /> },
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
    <button type="button" className="flex h-[66px] w-full items-center gap-[28px] text-left text-[#17181b] transition active:scale-[0.995]">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center text-[#15161a]">{item.icon}</span>
      <span className="flex min-w-0 flex-1 items-center gap-[16px]">
        <span className="truncate text-[25px] font-normal leading-none tracking-[-0.045em]">{item.title}</span>
        {item.badge ? (
          <span className="shrink-0 rounded-[7px] bg-[#ececf0] px-[10px] py-[3px] text-[15px] font-medium leading-none tracking-[-0.035em] text-[#505157]">
            {item.badge}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ConnectorRow({ item }: { item: ConnectorItem }) {
  return (
    <div className="flex h-[56px] items-center gap-[20px]">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center">{item.icon}</span>
      <span className="min-w-0 flex-1 truncate text-[21px] font-normal tracking-[-0.04em] text-[#24252a]">{item.title}</span>
      <button
        type="button"
        className="h-[44px] rounded-[22px] bg-white px-[26px] text-[17px] font-medium tracking-[-0.03em] text-[#202124] shadow-[0_8px_24px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] transition active:scale-[0.98]"
      >
        Connect
      </button>
    </div>
  );
}

export function KivoPlusSheet({ open, onClose }: KivoPlusSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
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

        <div className="-mx-[10px] mb-[40px] flex gap-[18px] overflow-x-auto px-[10px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <EmptyPreviewTile large />
          <EmptyPreviewTile />
          <EmptyPreviewTile />
          <EmptyPreviewTile />
        </div>

        <div className="space-y-[2px]">
          {actions.map((action) => (
            <ActionRow key={action.title} item={action} />
          ))}
        </div>

        <div className="my-[26px] h-px bg-black/[0.1]" />

        <section>
          <h3 className="mb-[14px] text-[22px] font-medium tracking-[-0.045em] text-[#6d6e76]">Connectors</h3>
          <div className="space-y-[10px]">
            {connectors.map((connector) => (
              <ConnectorRow key={connector.title} item={connector} />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
