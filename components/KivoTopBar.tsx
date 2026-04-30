'use client';

import { useState } from 'react';
import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';
import { KivoCreditsSheet } from './KivoCreditsSheet';

export function KivoTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-[20px] pt-[calc(env(safe-area-inset-top)+10px)]">
        <button aria-label="Go back" className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#202124]">
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <button className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+14px)] flex -translate-x-1/2 items-center gap-[6px] text-[20px] font-semibold tracking-[-0.03em] text-[#1f2023]">
          <span>Kivo</span>
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ececef]">
            <ChevronDown size={14} strokeWidth={2.4} />
          </span>
        </button>

        <button
          onClick={() => setOpen(true)}
          className="flex h-[40px] items-center gap-[6px] rounded-full border border-[#dedee2] bg-[#f8f8f9] px-[14px] text-[18px] font-medium tracking-[-0.02em] text-[#292a2e]"
        >
          <Sparkles size={18} strokeWidth={2} />
          <span>397</span>
        </button>
      </header>

      <KivoCreditsSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
