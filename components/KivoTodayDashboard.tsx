'use client';

import type { ReactNode } from 'react';
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Mail,
  RefreshCw,
  Sparkles,
  Tag,
  Target,
  Zap,
} from 'lucide-react';

type KivoTodayDashboardProps = {
  className?: string;
  onPromptSelect?: (prompt: string) => void;
};

type CardHeaderProps = {
  icon: ReactNode;
  title: string;
};

const priorities = [
  ['Finalize Q2 investor deck', 'High impact'],
  ['Review product feedback', 'Customer insights'],
  ['Prepare marketing sync', 'Team alignment'],
];

function EmptyCheck() {
  return <span className="block h-[17px] w-[17px] shrink-0 rounded-full border border-[#bfc0c5] bg-transparent" />;
}

function SoftCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[24px] border border-black/[0.045] bg-white/50 shadow-[0_14px_34px_rgba(15,23,42,0.032)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function InnerPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-black/[0.035] bg-[#f7f7f8]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${className}`}>{children}</div>;
}

function CardHeader({ icon, title }: CardHeaderProps) {
  return (
    <div className="flex h-[23px] items-center gap-[8px] text-[#202024]">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#202024]" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-none tracking-[-0.032em]">{title}</span>
      <ChevronRight size={13} strokeWidth={1.85} className="shrink-0 text-[#585960]" aria-hidden="true" />
    </div>
  );
}

export function KivoTodayDashboard({ className = '', onPromptSelect }: KivoTodayDashboardProps) {
  const selectPrompt = (prompt: string) => onPromptSelect?.(prompt);

  return (
    <section className={`absolute inset-x-0 top-[98px] bottom-[172px] z-20 overflow-y-auto px-[30px] pt-[4px] pb-[14px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`} aria-label="Today OS dashboard">
      <div className="mx-auto w-full max-w-[370px]">
        <div className="text-center">
          <h1 className="mx-auto whitespace-nowrap text-[29px] font-semibold leading-[1.08] tracking-[-0.064em] text-[#202024]">Good afternoon, Miro</h1>
          <p className="mt-[10px] text-[15px] font-normal leading-none tracking-[-0.035em] text-[#a4a5ab]">Your day at a glance</p>
        </div>

        <SoftCard className="mt-[24px] px-[17px] pb-[12px] pt-[14px]">
          <CardHeader icon={<Target size={15} strokeWidth={1.8} />} title="Top priorities" />
          <div className="mt-[13px]">
            {priorities.map(([title, subtitle], index) => (
              <div key={title}>
                <div className="flex min-h-[36px] items-center gap-[13px] py-[4px]">
                  <EmptyCheck />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-normal leading-[1.12] tracking-[-0.034em] text-[#202024]">{title}</p>
                    <p className="mt-[3px] truncate text-[11.5px] font-normal leading-none tracking-[-0.018em] text-[#94959c]">{subtitle}</p>
                  </div>
                </div>
                {index < priorities.length - 1 ? <div className="ml-[30px] h-px bg-black/[0.045]" /> : null}
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
          <SoftCard className="h-[108px] px-[12px] py-[13px]">
            <CardHeader icon={<Zap size={15} strokeWidth={1.75} />} title="Next task" />
            <InnerPanel className="mt-[11px] flex h-[53px] flex-col justify-center px-[10px]">
              <div className="flex items-center gap-[9px]">
                <EmptyCheck />
                <p className="min-w-0 truncate text-[12.5px] font-normal leading-none tracking-[-0.032em] text-[#202024]">User research analysis</p>
              </div>
              <div className="ml-[26px] mt-[8px] flex items-center gap-[5px] text-[#a3a4ab]">
                <Clock3 size={11} strokeWidth={1.7} />
                <span className="text-[11.5px] leading-none tracking-[-0.02em]">45 min</span>
              </div>
            </InnerPanel>
          </SoftCard>

          <SoftCard className="h-[108px] px-[12px] py-[13px]">
            <CardHeader icon={<CalendarDays size={15} strokeWidth={1.75} />} title="Today calendar" />
            <div className="mt-[13px] grid grid-cols-[17px_1fr] gap-x-[6px] pl-[1px]">
              <div className="relative row-span-3 flex flex-col items-center">
                <span className="absolute bottom-[6px] top-[6px] w-px bg-[#dadbe0]" />
                <span className="relative z-10 mt-[1px] h-[5.5px] w-[5.5px] rounded-full bg-[#c9cad0]" />
                <span className="relative z-10 mt-[17px] h-[5.5px] w-[5.5px] rounded-full bg-[#c9cad0]" />
                <span className="relative z-10 mt-[17px] h-[5.5px] w-[5.5px] rounded-full bg-[#c9cad0]" />
              </div>
              <p className="h-[23px] truncate text-[11px] leading-none tracking-[-0.022em] text-[#202024]"><span className="mr-[7px] text-[#92939a]">10:00</span>Team stand-up</p>
              <p className="h-[23px] truncate text-[11px] leading-none tracking-[-0.022em] text-[#202024]"><span className="mr-[7px] text-[#92939a]">13:00</span>Product review</p>
              <p className="h-[23px] truncate text-[11px] leading-none tracking-[-0.022em] text-[#202024]"><span className="mr-[7px] text-[#92939a]">16:00</span>Design sync</p>
            </div>
          </SoftCard>
        </div>

        <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
          <SoftCard className="h-[108px] px-[12px] py-[13px]">
            <CardHeader icon={<Sparkles size={15} strokeWidth={1.65} className="text-[#7C8CFF]" />} title="AI suggestion" />
            <button type="button" onClick={() => selectPrompt('Start a 25 minute focus session for my Kivo redesign and tell me the first step.')} className="mt-[11px] block w-full text-left active:scale-[0.99]">
              <InnerPanel className="h-[53px] px-[10px] py-[9px]">
                <div className="flex gap-[7px]">
                  <Sparkles size={12} strokeWidth={1.65} className="mt-[1px] shrink-0 text-[#7C8CFF]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-normal leading-[1.12] tracking-[-0.034em] text-[#202024]">Start Kivo redesign<br />for 25 min now</p>
                    <p className="mt-[5px] truncate text-[11.5px] leading-none tracking-[-0.018em] text-[#96979f]">Focus window available</p>
                  </div>
                </div>
              </InnerPanel>
            </button>
          </SoftCard>

          <SoftCard className="h-[108px] px-[12px] py-[13px]">
            <CardHeader icon={<RefreshCw size={14} strokeWidth={1.7} />} title="Open loops" />
            <div className="mt-[11px] space-y-[5px]">
              <div className="flex h-[26px] items-center gap-[7px] rounded-[11px] border border-black/[0.035] bg-[#f7f7f8]/70 px-[8px]">
                <Mail size={12} strokeWidth={1.7} className="shrink-0 text-[#202024]" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] tracking-[-0.025em] text-[#202024]">2 pending replies</span>
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#eeeeef] px-[5px] text-[10.5px] tracking-[-0.02em] text-[#202024]">2</span>
              </div>
              <div className="flex h-[26px] items-center gap-[7px] rounded-[11px] border border-black/[0.035] bg-[#f7f7f8]/70 px-[8px]">
                <CircleDollarSign size={12} strokeWidth={1.7} className="shrink-0 text-[#202024]" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] tracking-[-0.025em] text-[#202024]">1 bill due soon</span>
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#eeeeef] px-[5px] text-[10.5px] tracking-[-0.02em] text-[#202024]">1</span>
              </div>
            </div>
          </SoftCard>
        </div>

        <div className="mt-[10px] grid grid-cols-3 gap-[8px]">
          <button type="button" onClick={() => selectPrompt('Plan my day and suggest the most important next steps.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[6px] text-[12.5px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><CalendarDays size={14} strokeWidth={1.75} /><span className="truncate">Plan my day</span></button>
          <button type="button" onClick={() => selectPrompt('Check my inbox and show what needs attention.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[6px] text-[12.5px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><Mail size={14} strokeWidth={1.8} /><span className="truncate">Check inbox</span></button>
          <button type="button" onClick={() => selectPrompt('Find subscriptions, bills, or money leaks I should review.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[6px] text-[12.5px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><Tag size={14} strokeWidth={1.75} /><span className="truncate">Find savings</span></button>
        </div>
      </div>
    </section>
  );
}
