'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  Camera,
  FilePenLine,
  FolderPlus,
  Globe2,
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
  iconSrc: string;
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
  { title: 'Google Drive', iconSrc: '/connectors/google-drive.PNG' },
  { title: 'Gmail', iconSrc: '/connectors/gmail.PNG' },
  { title: 'Google Calendar', iconSrc: '/connectors/google-calendar.PNG' },
  { title: 'Outlook Calendar', iconSrc: '/connectors/outlook-calendar.PNG' },
  { title: 'Outlook Mail', iconSrc: '/connectors/outlook-mail.PNG' },
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

function ConnectorIcon({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-[7px]">
      {!failed ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
          draggable={false}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#f1f1f3] text-[12px] font-semibold text-[#777982]">
          {title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

function ConnectorRow({ item }: { item: ConnectorItem }) {
  return (
    <div className="flex h-[50px] items-center gap-[18px]">
      <ConnectorIcon src={item.iconSrc} title={item.title} />
      <span className="min-w-0 flex-1 truncate text-[18px] font-normal tracking-[-0.035em] text-[#24252a]">{item.title}</span>
      <button
        type="button"
        className="h-[40px] rounded-[20px] bg-white px-[22px] text-[15.5px] font-medium tracking-[-0.03em] text-[#202124] shadow-[0_8px_24px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02] transition active:scale-[0.98]"
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
              <ConnectorRow key={connector.title} item={connector} />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
