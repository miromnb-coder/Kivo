'use client';

import { X } from 'lucide-react';

export type KivoAttachment = {
  id: string;
  type: 'image';
  name: string;
  size: number;
  mimeType: string;
  url: string;
};

type PreviewTrayProps = {
  attachments: KivoAttachment[];
  onRemove: (id: string) => void;
};

export function KivoAttachmentPreviewTray({ attachments, onRemove }: PreviewTrayProps) {
  if (!attachments.length) return null;

  return (
    <div className="mb-[12px] -mx-[2px] flex gap-[10px] overflow-x-auto px-[2px] pb-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[22px] border border-black/[0.055] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onRemove(attachment.id)}
            className="absolute right-[7px] top-[7px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-black/65 text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] backdrop-blur active:scale-95"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function KivoMessageAttachments({ attachments }: { attachments?: KivoAttachment[] }) {
  if (!attachments?.length) return null;

  return (
    <div className="mb-[8px] flex max-w-full flex-wrap justify-end gap-[8px]">
      {attachments.map((attachment) => (
        <img
          key={attachment.id}
          src={attachment.url}
          alt={attachment.name}
          className="h-[104px] w-[104px] rounded-[22px] border border-black/[0.055] bg-white object-cover shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
          draggable={false}
        />
      ))}
    </div>
  );
}
