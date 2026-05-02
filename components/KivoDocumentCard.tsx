'use client';

import { FileText, MoreHorizontal } from 'lucide-react';

export type KivoDocumentCardData = {
  title?: string;
  subtitle?: string;
  content?: string;
  meta?: string;
  type?: string;
};

type Props = {
  document?: KivoDocumentCardData | null;
  onOpen?: (document: KivoDocumentCardData) => void;
};

function normalizeDocument(document?: KivoDocumentCardData | null) {
  if (!document || typeof document !== 'object') return null;
  const title = typeof document.title === 'string' ? document.title.trim() : '';
  const subtitle = typeof document.subtitle === 'string' ? document.subtitle.trim() : '';
  const content = typeof document.content === 'string' ? document.content.trim() : '';
  const meta = typeof document.meta === 'string' ? document.meta.trim() : '';
  const type = typeof document.type === 'string' ? document.type.trim() : 'Markdown';
  if (!title && !content) return null;
  return { title: title || 'Kivo document', subtitle, content, meta, type };
}

function estimateSizeKb(text: string) {
  const bytes = new Blob([text]).size;
  return Math.max(1, Math.round((bytes / 1024) * 10) / 10);
}

function stripMarkdown(text: string) {
  return text.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-*•]\s+/gm, '').replace(/^\d+[.)]\s+/gm, '').trim();
}

function previewBlocks(content: string) {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstParagraph = stripMarkdown(lines.slice(0, 3).join(' '));
  const heading = lines.find((line) => /^#{1,3}\s+/.test(line) || /^\*\*(.+)\*\*/.test(line));
  const headingText = heading ? stripMarkdown(heading) : null;
  const afterHeading = heading ? lines.slice(lines.indexOf(heading) + 1).find((line) => line && !/^#{1,3}\s+/.test(line)) : null;
  return { intro: firstParagraph, heading: headingText, body: afterHeading ? stripMarkdown(afterHeading) : '' };
}

export function KivoDocumentCard({ document, onOpen }: Props) {
  const safeDocument = normalizeDocument(document);
  if (!safeDocument) return null;
  const blocks = previewBlocks(safeDocument.content || safeDocument.subtitle || '');
  const size = estimateSizeKb([safeDocument.title, safeDocument.subtitle, safeDocument.content].filter(Boolean).join('\n\n'));

  return (
    <section className="my-[14px] overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
      <button type="button" onClick={() => onOpen?.(safeDocument)} className="flex w-full items-center gap-[14px] px-[14px] py-[13px] text-left active:scale-[0.995]">
        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[12px] bg-[#4d87f5] text-white shadow-[0_8px_18px_rgba(77,135,245,0.24)]">
          <FileText size={28} strokeWidth={2.15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[20px] font-semibold leading-[1.12] tracking-[-0.045em] text-[#242529]">{safeDocument.title}</div>
          <div className="mt-[4px] truncate text-[15px] leading-none tracking-[-0.02em] text-[#8a8b91]">{safeDocument.type || 'Markdown'} · {size} KB</div>
        </div>
        <MoreHorizontal size={25} strokeWidth={2.2} className="shrink-0 text-[#55565c]" />
      </button>
      <button type="button" onClick={() => onOpen?.(safeDocument)} className="relative block w-full border-t border-black/[0.055] px-[14px] pb-[16px] pt-[14px] text-left">
        {blocks.intro ? <p className="line-clamp-3 text-[16px] leading-[1.38] tracking-[-0.025em] text-[#333438]">{blocks.intro}</p> : null}
        {blocks.heading ? <h3 className="mt-[20px] line-clamp-2 text-[20px] font-semibold leading-[1.16] tracking-[-0.045em] text-[#2c2d31]">{blocks.heading}</h3> : null}
        {blocks.body ? <p className="mt-[8px] line-clamp-2 text-[15.5px] leading-[1.35] tracking-[-0.02em] text-[#3f4045]">{blocks.body}</p> : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46px] bg-gradient-to-b from-white/0 via-white/86 to-white" />
      </button>
    </section>
  );
}
