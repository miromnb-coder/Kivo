'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, ChevronDown, Menu, UserRound } from 'lucide-react';
import { KivoAgentSelector } from './KivoAgentSelector';

export function KivoTopBar() {
  const [agentOpen, setAgentOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-[20px] pt-[calc(env(safe-area-inset-top)+10px)]">
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#202124] transition active:scale-[0.96]"
        >
          <Menu size={31} strokeWidth={2.25} />
        </button>

        <button
          onClick={() => setAgentOpen(true)}
          className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+14px)] flex -translate-x-1/2 items-center gap-[6px] text-[20px] font-semibold tracking-[-0.03em] text-[#1f2023] transition active:scale-[0.98]"
        >
          <span>Kivo</span>
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ececef]">
            <ChevronDown size={14} strokeWidth={2.4} />
          </span>
        </button>

        <div className="flex h-[40px] items-center gap-[14px]">
          <Link
            href="/notifications"
            aria-label="Open notifications"
            className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#202124] transition active:scale-[0.96]"
          >
            <Bell size={29} strokeWidth={1.95} />
          </Link>

          <Link
            href="/profile"
            aria-label="Open profile"
            className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#202124] transition active:scale-[0.96]"
          >
            <UserRound size={29} strokeWidth={1.95} />
          </Link>
        </div>
      </header>

      <KivoAgentSelector open={agentOpen} onClose={() => setAgentOpen(false)} />
    </>
  );
}
