'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  Grid2X2,
  MoreHorizontal,
  Settings,
  Sparkles,
} from 'lucide-react';
import { KivoAgentSelector } from './KivoAgentSelector';

type KivoTopBarProps = {
  onOpenMenu?: () => void;
};

export function KivoTopBar({ onOpenMenu }: KivoTopBarProps) {
  const [agentOpen, setAgentOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-[30px] pt-[calc(env(safe-area-inset-top)+10px)]">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#111113] transition active:scale-[0.96]"
        >
          <span className="flex flex-col items-start gap-[8px]" aria-hidden="true">
            <span className="block h-[2.5px] w-[25px] rounded-full bg-current" />
            <span className="block h-[2.5px] w-[17px] rounded-full bg-current" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+8px)] flex h-[48px] -translate-x-1/2 items-center gap-[9px] rounded-full bg-white/82 px-[19px] text-[#111113] shadow-[0_18px_44px_rgba(15,23,42,0.055)] backdrop-blur-xl transition active:scale-[0.98]"
          aria-label="Open Kivo selector"
        >
          <span className="text-[11px] leading-none text-[#7C8CFF]" aria-hidden="true">✦</span>
          <span className="text-[21px] font-semibold tracking-[-0.055em]">Kivo</span>
          <span className="flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#f3f3f5] text-[#19191c]">
            <ChevronDown size={14} strokeWidth={2.5} />
          </span>
        </button>

        <button
          type="button"
          aria-label="Open more actions"
          onClick={() => setMoreOpen((value) => !value)}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#111113] transition active:scale-[0.96]"
        >
          <MoreHorizontal size={30} strokeWidth={2.75} />
        </button>
      </header>

      {moreOpen ? (
        <div className="fixed inset-0 z-[55]" aria-hidden="false">
          <button
            type="button"
            aria-label="Close more actions"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-transparent"
          />

          <div className="absolute right-[28px] top-[calc(env(safe-area-inset-top)+68px)] w-[282px] overflow-visible">
            <div className="absolute right-[15px] top-[-15px] h-[30px] w-[30px] rotate-45 rounded-[7px] bg-white/92 shadow-[0_8px_20px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.02]" />

            <div className="relative overflow-hidden rounded-[23px] bg-white/92 shadow-[0_20px_60px_rgba(15,23,42,0.075)] ring-1 ring-black/[0.03] backdrop-blur-2xl">
              <button type="button" onClick={() => setMoreOpen(false)} className="flex h-[48px] w-full items-center gap-[19px] px-[24px] text-left text-[15px] font-medium tracking-[-0.025em] text-[#16171a] active:scale-[0.99]">
                <Sparkles size={19} strokeWidth={1.9} />
                <span className="flex-1">New chat</span>
                <span className="text-[27px] font-light leading-none">+</span>
              </button>

              <div className="mx-[24px] h-px bg-black/[0.045]" />

              <Link href="/upgrade" onClick={() => setMoreOpen(false)} className="flex h-[48px] w-full items-center gap-[19px] px-[24px] text-left text-[15px] font-medium tracking-[-0.025em] text-[#16171a] active:scale-[0.99]">
                <CircleDollarSign size={19} strokeWidth={1.9} />
                <span className="flex-1">Credits</span>
                <span className="rounded-full bg-[#eeeeF2] px-[11px] py-[4px] text-[13px] font-medium text-[#666872]">397</span>
              </Link>

              <div className="mx-[24px] h-px bg-black/[0.045]" />

              <Link href="/notifications" onClick={() => setMoreOpen(false)} className="flex h-[48px] w-full items-center gap-[19px] px-[24px] text-left text-[15px] font-medium tracking-[-0.025em] text-[#16171a] active:scale-[0.99]">
                <Bell size={19} strokeWidth={1.9} />
                <span className="flex-1">Notifications</span>
                <span className="h-[9px] w-[9px] rounded-full bg-black" />
              </Link>

              <div className="mx-[24px] h-px bg-black/[0.045]" />

              <Link href="/tools" onClick={() => setMoreOpen(false)} className="flex h-[48px] w-full items-center gap-[19px] px-[24px] text-left text-[15px] font-medium tracking-[-0.025em] text-[#16171a] active:scale-[0.99]">
                <Grid2X2 size={19} strokeWidth={1.9} />
                <span className="flex-1">Tools</span>
                <span className="text-[29px] font-light leading-none">›</span>
              </Link>

              <div className="mx-[24px] h-px bg-black/[0.045]" />

              <Link href="/settings" onClick={() => setMoreOpen(false)} className="flex h-[48px] w-full items-center gap-[19px] px-[24px] text-left text-[15px] font-medium tracking-[-0.025em] text-[#16171a] active:scale-[0.99]">
                <Settings size={19} strokeWidth={1.9} />
                <span className="flex-1">Settings</span>
                <span className="text-[29px] font-light leading-none">›</span>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <KivoAgentSelector open={agentOpen} onClose={() => setAgentOpen(false)} />
    </>
  );
}
