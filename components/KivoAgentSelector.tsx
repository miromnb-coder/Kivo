'use client';

import { Check } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type KivoMode = {
  title: string;
  description: string;
  selected?: boolean;
};

const kivoModes: KivoMode[] = [
  {
    title: 'Kivo Max · Pro only',
    description: 'High-performance operator for complex tasks.',
  },
  {
    title: 'Kivo Core',
    description: 'Balanced AI for daily planning and actions.',
    selected: true,
  },
  {
    title: 'Kivo Lite',
    description: 'Fast assistant for everyday questions.',
  },
];

export function KivoAgentSelector({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      <button
        type="button"
        aria-label="Close Kivo mode selector"
        onClick={onClose}
        className="absolute inset-0 bg-black/[0.055] backdrop-blur-[1px]"
      />

      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+52px)] flex justify-center px-[20px]">
        <div className="relative w-[208px] max-w-[calc(100vw-96px)] overflow-hidden rounded-[13px] bg-white shadow-[0_18px_54px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.055]">
          {kivoModes.map((mode, index) => (
            <button
              key={mode.title}
              type="button"
              onClick={onClose}
              className="grid w-full grid-cols-[26px_1fr] gap-[9px] bg-white px-[13px] py-[11px] text-left transition hover:bg-[#f7f7f8] active:scale-[0.995]"
            >
              <span className="flex h-[21px] items-center justify-center pt-[1px] text-[#202024]">
                {mode.selected ? <Check size={14} strokeWidth={2.15} /> : null}
              </span>

              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[14px] font-medium leading-[1.08] tracking-[-0.034em] text-[#111113]">
                  {mode.title}
                </span>
                <span className="mt-[5px] block max-w-[142px] text-[12.5px] font-normal leading-[1.28] tracking-[-0.026em] text-[#6f7077]">
                  {mode.description}
                </span>
              </span>

              {index < kivoModes.length - 1 ? <span className="col-span-2 mt-[8px] h-px bg-black/[0.05]" /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
