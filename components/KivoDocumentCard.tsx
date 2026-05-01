'use client';

import { Copy, Maximize2 } from 'lucide-react';

type KivoDocumentCardData = {
  title?: string;
  subtitle?: string;
  content?: string;
  meta?: string;
};

type Props = {
  document?: KivoDocumentCardData | null;
};

function normalizeDocument(document?: KivoDocumentCardData | null) {
  if (!document || typeof document !== 'object') return null;
  const title = typeof document.title === 'string' ? document.title.trim() : '';
  const subtitle = typeof document.subtitle === 'string' ? document.subtitle.trim() : '';
  const content = typeof document.content === 'string' ? document.content.trim() : '';
  const meta = typeof document.meta === 'string' ? document.meta.trim() : '';

  if (!title && !content) return null;

  return {
    title: title || 'Kivo document',
    subtitle,
    content,
    meta,
  };
}

export function KivoDocumentCard({ document }: Props) {
  const safeDocument = normalizeDocument(document);
  if (!safeDocument) return null;

  async function copyContent() {
    const text = [safeDocument?.title, safeDocument?.subtitle, safeDocument?.content].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can fail on older browsers or non-secure contexts.
    }
  }

  return (
    <section className="mt-[14px] overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/78 shadow-[0_18px_45px_rgba(15,23,42,0.055)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-[14px] border-b border-black/[0.055] px-[18px] py-[15px]">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium tracking-[-0.02em] text-[#8b8c91]">{safeDocument.meta || 'Document'}</div>
          <h3 className="mt-[4px] text-[21px] font-semibold leading-[1.15] tracking-[-0.045em] text-[#17181b]">{safeDocument.title}</h3>
          {safeDocument.subtitle ? <p className="mt-[5px] text-[14.5px] leading-[1.3] tracking-[-0.025em] text-[#6f7076]">{safeDocument.subtitle}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-[8px]">
          <button type="button" aria-label="Copy document" onClick={copyContent} className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#f4f4f5] text-[#323338] active:scale-95">
            <Copy size={17} strokeWidth={2} />
          </button>
          <button type="button" aria-label="Open document" className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#f4f4f5] text-[#323338] active:scale-95">
            <Maximize2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {safeDocument.content ? (
        <div className="px-[18px] py-[16px] text-[16px] leading-[1.55] tracking-[-0.025em] text-[#24252a] whitespace-pre-wrap">
          {safeDocument.content}
        </div>
      ) : null}
    </section>
  );
}
