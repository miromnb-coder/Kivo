'use client';

import Link from 'next/link';
import {
  Bot,
  Brain,
  Check,
  ChevronRight,
  CircleDot,
  Grid2X2,
  Settings,
  Sparkles,
} from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type WorkspaceItem = {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
};

const workspaceItems: WorkspaceItem[] = [
  { label: 'Today OS', description: 'Your daily workspace', href: '/today', icon: CircleDot },
  { label: 'Agents', description: 'AI agents and automation', href: '/agents', icon: Bot },
  { label: 'Memory', description: 'Your knowledge vault', href: '/memory', icon: Brain },
  { label: 'Tools', description: 'All tools and integrations', href: '/tools', icon: Grid2X2 },
];

export function KivoAgentSelector({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-auto">
      <button type="button" aria-label="Close Kivo menu" onClick={onClose} className="absolute inset-0 bg-transparent" />

      <div className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+72px)] flex justify-center px-[20px]">
        <div className="relative w-[360px] max-w-[calc(100vw-48px)] overflow-visible">
          <div className="pointer-events-none absolute left-1/2 top-[-12px] h-[26px] w-[26px] -translate-x-1/2 rotate-45 rounded-[5px] bg-white/92 ring-1 ring-black/[0.02]" />

          <div className="relative overflow-hidden rounded-[27px] bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.085)] ring-1 ring-black/[0.03] backdrop-blur-2xl">
            <button
              type="button"
              onClick={onClose}
              className="mx-[24px] mt-[18px] flex h-[54px] w-[calc(100%-48px)] items-center gap-[20px] rounded-[17px] px-[16px] text-left transition active:scale-[0.99]"
            >
              <Sparkles size={20} strokeWidth={1.9} className="shrink-0 text-[#7b8088]" />
              <span className="flex-1 text-[18px] font-medium tracking-[-0.035em] text-[#15161a]">
                Kivo <span className="font-normal">(Default)</span>
              </span>
              <Check size={23} strokeWidth={2} className="text-[#15161a]" />
            </button>

            <div className="mx-[24px] mt-[10px] h-px bg-black/[0.045]" />

            <div className="py-[1px]">
              {workspaceItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex h-[82px] items-center gap-[22px] px-[32px] text-left transition hover:bg-black/[0.018] active:scale-[0.99]"
                    >
                      <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center text-[#15161a]">
                        <Icon size={23} strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[18px] font-medium leading-[1.05] tracking-[-0.035em] text-[#15161a]">{item.label}</span>
                        <span className="mt-[6px] block text-[14px] leading-none tracking-[-0.025em] text-[#70727a]">{item.description}</span>
                      </span>
                    </Link>
                    {index < workspaceItems.length - 1 ? <div className="mx-[32px] h-px bg-black/[0.045]" /> : null}
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-black/[0.045]" />

            <Link
              href="/workspaces"
              onClick={onClose}
              className="flex h-[80px] items-center gap-[22px] bg-black/[0.012] px-[32px] text-left transition hover:bg-black/[0.025] active:scale-[0.99]"
            >
              <span className="flex h-[25px] w-[25px] shrink-0 items-center justify-center text-[#15161a]">
                <Settings size={23} strokeWidth={1.9} />
              </span>
              <span className="flex-1 text-[17px] font-medium tracking-[-0.035em] text-[#15161a]">Manage workspaces</span>
              <ChevronRight size={23} strokeWidth={2} className="text-[#4f5259]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
