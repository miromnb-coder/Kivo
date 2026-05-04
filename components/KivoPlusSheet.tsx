'use client';

import { useEffect, useState } from 'react';
import {
  Camera,
  CheckSquare,
  ChevronRight,
  Code2,
  FileText,
  Globe2,
  Grid2X2,
  ImageIcon,
  MessageCircle,
  Paperclip,
  SlidersHorizontal,
  X,
} from 'lucide-react';

type KivoPlusSheetProps = {
  open: boolean;
  onClose: () => void;
};

type QuickPreview = {
  kind: 'camera' | 'image' | 'task' | 'chart' | 'pdf';
  title?: string;
};

type MenuAction = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  brand?: 'drive' | 'onedrive';
};

const quickPreviews: QuickPreview[] = [
  { kind: 'camera' },
  { kind: 'image' },
  { kind: 'task', title: 'Q2 Report\nanalysis' },
  { kind: 'chart' },
  { kind: 'pdf' },
];

const createActions: MenuAction[] = [
  { title: 'New chat', subtitle: 'Start a fresh conversation', icon: <MessageCircle size={20} strokeWidth={1.9} /> },
  { title: 'New task', subtitle: 'Ask Kivo to do something', icon: <CheckSquare size={20} strokeWidth={1.9} /> },
];

const addActions: MenuAction[] = [
  { title: 'Upload files', subtitle: 'Add files from your device', icon: <Paperclip size={20} strokeWidth={1.9} /> },
  { title: 'Google Drive', subtitle: 'Add files from Drive', icon: null, brand: 'drive' },
  { title: 'OneDrive', subtitle: 'Add files from OneDrive', icon: null, brand: 'onedrive' },
  { title: 'Use a connector', subtitle: 'Bring in data from your apps', icon: <FileText size={20} strokeWidth={1.9} /> },
];

const toolActions: MenuAction[] = [
  { title: 'Use tools', subtitle: 'Access AI tools and features', icon: <SlidersHorizontal size={20} strokeWidth={1.9} /> },
  { title: 'Search the web', subtitle: 'Get real-time information', icon: <Globe2 size={20} strokeWidth={1.9} /> },
  { title: 'Generate image', subtitle: 'Create images with AI', icon: <ImageIcon size={20} strokeWidth={1.9} /> },
  { title: 'Run code', subtitle: 'Write and execute code', icon: <Code2 size={20} strokeWidth={1.9} /> },
];

const moreActions: MenuAction[] = [
  { title: 'Browse all apps', subtitle: 'Explore all integrations and apps', icon: <Grid2X2 size={20} strokeWidth={1.9} /> },
];

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[23px] w-[23px]" aria-hidden="true">
      <path fill="#1FA463" d="M18.4 6h11.2l14.1 24.4H32.4L18.4 6Z" />
      <path fill="#FFD04B" d="M18.4 6 4.3 30.4l5.6 9.6L24 15.6 18.4 6Z" />
      <path fill="#4688F1" d="M9.9 40h28.2l5.6-9.6H15.5L9.9 40Z" />
    </svg>
  );
}

function OneDriveIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[24px] w-[24px]" aria-hidden="true">
      <path fill="#0364B8" d="M19.5 19.2a10.7 10.7 0 0 1 19.1 4.7 8.7 8.7 0 0 1-.5 17.3H15.8a9.5 9.5 0 0 1 3.7-22Z" opacity=".95" />
      <path fill="#1490DF" d="M9.4 41.2a8.5 8.5 0 0 1 7.8-12 11.4 11.4 0 0 1 21.4-4.8 9.3 9.3 0 0 0-5.6-1.9c-4.7 0-8.7 3.4-9.4 7.9a8.3 8.3 0 0 0-14.2 10.8Z" />
      <path fill="#28A8EA" d="M15.8 41.2h22.3a8.7 8.7 0 0 0 .5-17.3 11.4 11.4 0 0 0-21.4 5.3 8.5 8.5 0 0 0-1.4 12Z" />
    </svg>
  );
}

function BrandIcon({ brand }: { brand?: MenuAction['brand'] }) {
  if (brand === 'drive') return <GoogleDriveIcon />;
  if (brand === 'onedrive') return <OneDriveIcon />;
  return null;
}

function PreviewCard({ item }: { item: QuickPreview }) {
  if (item.kind === 'camera') {
    return (
      <button type="button" className="flex h-[82px] min-w-[82px] items-center justify-center rounded-[17px] border border-black/[0.045] bg-white/70 text-[#1f2023] shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        <Camera size={24} strokeWidth={1.9} />
      </button>
    );
  }

  if (item.kind === 'image') {
    return (
      <button type="button" className="relative h-[82px] min-w-[82px] overflow-hidden rounded-[17px] border border-black/[0.045] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,#f4c7de_0%,#b7c8ee_44%,#1d2430_100%)]" />
        <span className="absolute bottom-[8px] left-[8px] flex h-[24px] w-[24px] items-center justify-center rounded-[7px] bg-white/90 text-[#6f63d8]"><ImageIcon size={15} /></span>
      </button>
    );
  }

  if (item.kind === 'task') {
    return (
      <button type="button" className="relative h-[82px] min-w-[82px] rounded-[17px] border border-black/[0.045] bg-white/72 p-[12px] text-left shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        <span className="whitespace-pre-line text-[12px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#15161a]">{item.title}</span>
        <span className="absolute bottom-[8px] left-[8px] flex h-[21px] w-[21px] items-center justify-center rounded-[7px] bg-[#f0f6ef] text-[#3aad45]"><CheckSquare size={13} /></span>
      </button>
    );
  }

  if (item.kind === 'chart') {
    return (
      <button type="button" className="relative h-[82px] min-w-[82px] overflow-hidden rounded-[17px] border border-black/[0.045] bg-white/72 shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
        <svg viewBox="0 0 82 82" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M14 52h54" stroke="#e7e7eb" strokeWidth="1" />
          <path d="M14 38h54" stroke="#eeeeF2" strokeWidth="1" />
          <path d="M18 49 32 35 44 42 62 24" fill="none" stroke="#78a9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="18" y="57" width="8" height="12" rx="2" fill="#eceef3" />
          <rect x="34" y="52" width="8" height="17" rx="2" fill="#e5e8ef" />
          <rect x="50" y="46" width="8" height="23" rx="2" fill="#dfe4ee" />
        </svg>
        <span className="absolute bottom-[8px] left-[8px] flex h-[21px] w-[21px] items-center justify-center rounded-[7px] bg-white/90 text-[#4d9de8]"><ImageIcon size={13} /></span>
      </button>
    );
  }

  return (
    <button type="button" className="relative h-[82px] min-w-[82px] rounded-[17px] border border-black/[0.045] bg-white/72 p-[10px] shadow-[0_10px_26px_rgba(15,23,42,0.025)]">
      <div className="space-y-[5px] pt-[7px]">
        <div className="h-[4px] w-[54px] rounded-full bg-[#d9d9de]" />
        <div className="h-[4px] w-[44px] rounded-full bg-[#e1e1e6]" />
        <div className="h-[4px] w-[50px] rounded-full bg-[#e8e8ed]" />
      </div>
      <span className="absolute bottom-[8px] left-[8px] flex h-[21px] w-[21px] items-center justify-center rounded-[7px] bg-white/90 text-[#e21d38]"><FileText size={13} /></span>
    </button>
  );
}

function ActionSection({ title, actions }: { title: string; actions: MenuAction[] }) {
  return (
    <section className="mt-[15px]">
      <h3 className="mb-[8px] px-[4px] text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#70727a]">{title}</h3>
      <div className="overflow-hidden rounded-[19px] border border-black/[0.045] bg-white/72 shadow-[0_10px_28px_rgba(15,23,42,0.024)]">
        {actions.map((action, index) => (
          <button key={action.title} type="button" className="flex min-h-[55px] w-full items-center gap-[13px] px-[12px] text-left transition active:scale-[0.995]">
            <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[12px] bg-[#f2f2f3] text-[#191a1e]">
              {action.brand ? <BrandIcon brand={action.brand} /> : action.icon}
            </span>
            <span className="min-w-0 flex-1 border-b border-black/[0.045] py-[9px] last:border-b-0">
              <span className="block truncate text-[13.8px] font-semibold tracking-[-0.035em] text-[#15161a]">{action.title}</span>
              <span className="mt-[2px] block truncate text-[11.5px] tracking-[-0.025em] text-[#70727a]">{action.subtitle}</span>
            </span>
            <ChevronRight size={18} strokeWidth={2.1} className="shrink-0 text-[#8b8d94]" />
          </button>
        ))}
      </div>
    </section>
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
    window.setTimeout(onClose, 160);
  }

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <button
        type="button"
        aria-label="Close actions"
        onClick={closeWithAnimation}
        className={`absolute inset-0 pointer-events-auto bg-black/10 backdrop-blur-[2px] transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className={`absolute inset-x-0 bottom-[92px] mx-auto w-[360px] max-w-[calc(100vw-34px)] origin-bottom pointer-events-auto transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-[14px] scale-[0.97] opacity-0'}`}>
        <div className="relative overflow-visible">
          <div className="absolute left-1/2 top-[15px] h-[4px] w-[36px] -translate-x-1/2 rounded-full bg-[#c7c7cc]" />
          <button type="button" onClick={closeWithAnimation} aria-label="Close" className="absolute right-[14px] top-[14px] z-10 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f2f2f3] text-[#111] transition active:scale-[0.96]"><X size={21} strokeWidth={2.1} /></button>

          <div className="max-h-[76vh] overflow-y-auto overscroll-contain rounded-[28px] bg-white/94 px-[18px] pb-[18px] pt-[44px] shadow-[0_18px_54px_rgba(15,23,42,0.09)] ring-1 ring-black/[0.035] backdrop-blur-2xl [-webkit-overflow-scrolling:touch]">
            <div className="-mx-[2px] flex gap-[10px] overflow-x-auto pb-[18px] pr-[8px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickPreviews.map((item, index) => <PreviewCard key={`${item.kind}-${index}`} item={item} />)}
            </div>

            <ActionSection title="Create" actions={createActions} />
            <ActionSection title="Add to message" actions={addActions} />
            <ActionSection title="Tools" actions={toolActions} />
            <ActionSection title="More" actions={moreActions} />
          </div>
        </div>
      </div>
    </div>
  );
}
