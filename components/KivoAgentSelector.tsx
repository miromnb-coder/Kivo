'use client';

import { CalendarDays, Check, CircleDollarSign, Search, Sparkles, UserRound } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

const agents = [
  { label: 'Kivo', icon: Sparkles, active: true },
  { label: 'Planner', icon: CalendarDays },
  { label: 'Researcher', icon: Search },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Personal Operator', icon: UserRound },
];

export function KivoAgentSelector({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      <button type="button" aria-label="Close agent selector" onClick={onClose} className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+74px)] flex justify-center px-[20px]">
        <div className="relative w-[315px] rounded-[18px] border border-black/[0.045] bg-white/82 px-[18px] py-[9px] shadow-[0_22px_64px_rgba(15,23,42,0.11)] backdrop-blur-[22px]">
          <div className="pointer-events-none absolute left-1/2 top-[-10px] h-[22px] w-[22px] -translate-x-1/2 rotate-45 border-l border-t border-black/[0.035] bg-white/82 backdrop-blur-[22px]" />
          <div className="relative">
            {agents.map((agent, index) => {
              const Icon = agent.icon;
              return (
                <button key={agent.label} type="button" onClick={onClose} className="flex h-[70px] w-full items-center text-left">
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#eeeeef] text-[#1c1c1e]">
                    <Icon size={22} strokeWidth={1.9} />
                  </span>
                  <span className="ml-[18px] flex-1 text-[20px] font-normal tracking-[-0.04em] text-[#1c1c1e]">{agent.label}</span>
                  {agent.active ? <Check size={24} strokeWidth={1.8} className="text-[#1c1c1e]" /> : null}
                  {index < agents.length - 1 ? <span className="absolute left-[56px] right-[0px] mt-[70px] h-px bg-black/[0.055]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
