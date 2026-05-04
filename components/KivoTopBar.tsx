'use client';

import { useState } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { KivoAgentSelector } from './KivoAgentSelector';

type KivoTopBarProps = {
  onOpenMenu?: () => void;
};

export function KivoTopBar({ onOpenMenu }: KivoTopBarProps) {
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-[28px] pt-[calc(env(safe-area-inset-top)+10px)]">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#111113] transition active:scale-[0.96]"
        >
          <span className="flex flex-col items-start gap-[7px]" aria-hidden="true">
            <span className="block h-[2.5px] w-[24px] rounded-full bg-current" />
            <span className="block h-[2.5px] w-[17px] rounded-full bg-current" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+8px)] flex h-[52px] -translate-x-1/2 items-center gap-[10px] rounded-full bg-white/86 px-[22px] text-[#111113] shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl transition active:scale-[0.98]"
          aria-label="Open Kivo selector"
        >
          <span className="text-[13px] leading-none text-[#7C8CFF]" aria-hidden="true">✦</span>
          <span className="text-[22px] font-semibold tracking-[-0.045em]">Kivo</span>
          <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#f1f1f3] text-[#19191c]">
            <ChevronDown size={15} strokeWidth={2.4} />
          </span>
        </button>

        <button
          type="button"
          aria-label="Open more actions"
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#111113] transition active:scale-[0.96]"
        >
          <MoreHorizontal size={31} strokeWidth={2.5} />
        </button>
      </header>

      <KivoAgentSelector open={agentOpen} onClose={() => setAgentOpen(false)} />
    </>
  );
}
