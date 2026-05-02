'use client';

import { ChevronRight, Globe2, Lock, MousePointer2 } from 'lucide-react';

export type KivoBrowserPreviewAction = 'open' | 'search' | 'read' | 'click' | 'type' | 'scroll' | 'extract' | 'done';

export type KivoBrowserPreview = {
  url?: string;
  title?: string;
  action?: KivoBrowserPreviewAction;
  actionLabel?: string;
  screenshotUrl?: string;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cursor?: {
    x: number;
    y: number;
  };
  status?: 'idle' | 'running' | 'done';
};

type Props = {
  preview?: KivoBrowserPreview | null;
};

function getHost(url?: string) {
  if (!url) return 'kivo browser';

  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || 'kivo browser';
  }
}

function actionText(preview: KivoBrowserPreview) {
  if (preview.actionLabel) return preview.actionLabel;
  if (preview.action === 'click') return 'Clicking selected element';
  if (preview.action === 'type') return 'Typing into the page';
  if (preview.action === 'scroll') return 'Scrolling page';
  if (preview.action === 'search') return 'Searching the page';
  if (preview.action === 'read') return 'Reading page content';
  if (preview.action === 'extract') return 'Extracting useful details';
  if (preview.action === 'done') return 'Browser task complete';
  return 'Opening page';
}

function PlaceholderPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_18%_18%,#ffffff_0%,#f7f7f8_38%,#ececef_100%)]">
      <div className="absolute left-[18px] right-[18px] top-[18px] flex items-center gap-[10px] rounded-[14px] border border-black/[0.055] bg-white/80 px-[12px] py-[10px] shadow-[0_10px_30px_rgba(15,23,42,0.045)] backdrop-blur-xl">
        <div className="h-[10px] w-[72px] rounded-full bg-[#e5e5e8]" />
        <div className="h-[10px] flex-1 rounded-full bg-[#f0f0f2]" />
      </div>

      <div className="absolute left-[20px] right-[20px] top-[74px] space-y-[10px]">
        <div className="h-[18px] w-[62%] rounded-full bg-[#d9dade]" />
        <div className="h-[12px] w-[86%] rounded-full bg-[#e6e6e9]" />
        <div className="h-[12px] w-[72%] rounded-full bg-[#eeeeF0]" />
      </div>

      <div className="absolute bottom-[20px] left-[20px] right-[20px] grid grid-cols-[0.7fr_1fr] gap-[12px]">
        <div className="h-[58px] rounded-[14px] bg-white/82 shadow-[0_10px_26px_rgba(15,23,42,0.04)]" />
        <div className="h-[58px] rounded-[14px] bg-white/82 shadow-[0_10px_26px_rgba(15,23,42,0.04)]" />
      </div>
    </div>
  );
}

export function KivoMiniBrowserPreview({ preview }: Props) {
  if (!preview) return null;

  const host = getHost(preview.url);
  const isRunning = preview.status !== 'done';
  const label = actionText(preview);

  return (
    <section className="mt-[14px] overflow-hidden rounded-[24px] border border-black/[0.055] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-[12px] border-b border-black/[0.055] px-[14px] py-[12px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[12px] bg-[#f3f3f5] text-[#17181c]">
            <Globe2 size={18} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold leading-[1.1] tracking-[-0.035em] text-[#15161a]">Live preview</div>
            <div className="mt-[3px] flex min-w-0 items-center gap-[5px] text-[12.5px] tracking-[-0.02em] text-[#888992]">
              <span className={`h-[7px] w-[7px] rounded-full ${isRunning ? 'bg-[#2563eb] animate-pulse' : 'bg-[#58a96b]'}`} />
              <span className="truncate">{isRunning ? 'Kivo is browsing' : 'Finished browsing'}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-[6px] rounded-full bg-[#f5f5f6] px-[10px] py-[7px] text-[12.5px] font-medium tracking-[-0.02em] text-[#7a7b84]">
          <span className="truncate">{host}</span>
          <Lock size={13} strokeWidth={2.1} className="shrink-0" />
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden bg-[#f4f4f5]">
        {preview.screenshotUrl ? (
          <img src={preview.screenshotUrl} alt={preview.title || 'Browser preview'} className="h-full w-full object-cover" />
        ) : (
          <PlaceholderPreview />
        )}

        {preview.highlight ? (
          <div
            className="absolute rounded-[10px] border-2 border-[#2563eb] bg-[#2563eb]/10 shadow-[0_0_0_999px_rgba(255,255,255,0.08)] transition-all duration-300"
            style={{
              left: `${preview.highlight.x}%`,
              top: `${preview.highlight.y}%`,
              width: `${preview.highlight.width}%`,
              height: `${preview.highlight.height}%`,
            }}
          />
        ) : null}

        {preview.cursor ? (
          <MousePointer2
            size={30}
            strokeWidth={2.4}
            className="absolute -translate-x-[3px] -translate-y-[3px] fill-white text-[#111114] drop-shadow-[0_8px_14px_rgba(0,0,0,0.24)] transition-all duration-300"
            style={{ left: `${preview.cursor.x}%`, top: `${preview.cursor.y}%` }}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-[10px] px-[14px] py-[12px]">
        <div className="flex min-w-0 items-center gap-[8px]">
          <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#2563eb]" />
          <span className="truncate text-[14px] font-medium tracking-[-0.025em] text-[#303137]">{label}</span>
        </div>
        <ChevronRight size={17} strokeWidth={2.2} className="shrink-0 text-[#9b9ca3]" />
      </div>
    </section>
  );
}
