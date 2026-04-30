'use client';

import { Brain, Briefcase, Check, CircleDollarSign, Globe2, MessageCircleMore, Zap } from 'lucide-react';

type KivoModePopoverProps = {
  open: boolean;
  onClose: () => void;
};

export function KivoModePopover({ open, onClose }: KivoModePopoverProps) {
  if (!open) return null;

  const modes = [
    { label: 'Chat', sub: 'General conversation', icon: MessageCircleMore, active: true },
    { label: 'Ask AI', sub: 'Quick answers', icon: Zap },
    { label: 'Deep Task', sub: 'Multi-step reasoning', icon: Brain },
  ];

  const contexts = [
    { label: 'General', icon: Globe2, active: true },
    { label: 'Work', icon: Briefcase },
    { label: 'Finance', icon: CircleDollarSign },
  ];

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      <button type="button" aria-label="Close mode menu" onClick={onClose} className="absolute inset-0 bg-transparent" />
      <div className="absolute inset-x-0 bottom-[133px] flex justify-center px-[20px]">
        <div className="relative w-[318px] rounded-[18px] border border-black/[0.045] bg-white/82 px-[20px] pb-[15px] pt-[18px] shadow-[0_22px_64px_rgba(15,23,42,0.11)] backdrop-blur-[22px]">
          <div className="pointer-events-none absolute bottom-[-14px] left-1/2 h-[28px] w-[28px] -translate-x-1/2 rotate-45 border-b border-r border-black/[0.035] bg-white/82 shadow-[10px_10px_28px_rgba(15,23,42,0.055)] backdrop-blur-[22px]" />
          <div className="relative">
            <div className="mb-[12px] text-[12px] font-normal uppercase tracking-[0.16em] text-[#8d8d93]">Mode</div>
            <div className="space-y-[14px]">
              {modes.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={onClose} className="flex w-full items-center gap-[18px] pr-[3px] text-left">
                    <span className="flex h-[25px] w-[25px] items-center justify-center text-[#1c1c1e]"><Icon size={22} strokeWidth={1.85} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-normal leading-[1.08] tracking-[-0.035em] text-[#1c1c1e]">{item.label}</span>
                      <span className="mt-[4px] block text-[15px] leading-none tracking-[-0.02em] text-[#8f8f96]">{item.sub}</span>
                    </span>
                    {item.active ? <Check size={22} strokeWidth={1.7} className="mr-[1px] text-[#1c1c1e]" /> : <span className="h-[22px] w-[22px]" />}
                  </button>
                );
              })}
            </div>
            <div className="mx-[-20px] my-[17px] h-px bg-black/[0.045]" />
            <div className="mb-[13px] text-[12px] font-normal uppercase tracking-[0.16em] text-[#8d8d93]">Context</div>
            <div className="space-y-[18px]">
              {contexts.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={onClose} className="flex w-full items-center gap-[18px] pr-[3px] text-left">
                    <span className="flex h-[25px] w-[25px] items-center justify-center text-[#1c1c1e]"><Icon size={22} strokeWidth={1.85} /></span>
                    <span className="min-w-0 flex-1 text-[19px] font-normal leading-none tracking-[-0.035em] text-[#1c1c1e]">{item.label}</span>
                    {item.active ? <Check size={22} strokeWidth={1.7} className="mr-[1px] text-[#1c1c1e]" /> : <span className="h-[22px] w-[22px]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
