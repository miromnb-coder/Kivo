'use client';

import { Check, FileText, Loader2, PenLine, Search, Sparkles } from 'lucide-react';

export type KivoExecutionStep = {
  id?: string;
  title?: string;
  label?: string;
  detail?: string;
  status?: 'pending' | 'running' | 'active' | 'done' | 'completed';
  kind?: 'search' | 'plan' | 'write' | 'tool' | 'think';
};

type Props = {
  steps?: KivoExecutionStep[] | null;
};

function normalizeSteps(steps?: KivoExecutionStep[] | null) {
  if (!Array.isArray(steps)) return [];

  return steps
    .map((step) => {
      const title = typeof step.title === 'string' ? step.title.trim() : typeof step.label === 'string' ? step.label.trim() : '';
      const detail = typeof step.detail === 'string' ? step.detail.trim() : '';
      const rawStatus = step.status ?? 'pending';
      const status = rawStatus === 'completed' ? 'done' : rawStatus === 'active' ? 'running' : rawStatus;
      const kind = step.kind ?? 'think';
      const id = typeof step.id === 'string' ? step.id : title;

      return { id, title, detail, status, kind };
    })
    .filter((step) => step.title.length > 0)
    .slice(0, 6);
}

function PendingIcon({ kind }: { kind: KivoExecutionStep['kind'] }) {
  if (kind === 'search') return <Search size={13} strokeWidth={2.2} />;
  if (kind === 'write') return <PenLine size={13} strokeWidth={2.2} />;
  if (kind === 'plan') return <FileText size={13} strokeWidth={2.2} />;
  return <Sparkles size={13} strokeWidth={2.2} />;
}

function StepIcon({ step }: { step: ReturnType<typeof normalizeSteps>[number] }) {
  if (step.status === 'done') {
    return (
      <span className="relative flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#111113] text-white shadow-[0_7px_18px_rgba(0,0,0,0.12)] transition-all duration-300">
        <Check size={14} strokeWidth={2.6} />
      </span>
    );
  }

  if (step.status === 'running') {
    return (
      <span className="relative flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-white text-[#111113] shadow-[0_8px_22px_rgba(0,0,0,0.11)] ring-1 ring-black/[0.06] transition-all duration-300">
        <span className="absolute inset-[-4px] rounded-full bg-black/[0.055] blur-[5px] animate-pulse" />
        <Loader2 size={14} strokeWidth={2.4} className="relative animate-spin" />
      </span>
    );
  }

  return (
    <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-[#eeeeef] text-[#9b9ca2] ring-1 ring-black/[0.035] transition-all duration-300">
      <PendingIcon kind={step.kind} />
    </span>
  );
}

function statusLabel(status: string) {
  if (status === 'done') return 'Done';
  if (status === 'running') return 'Running';
  return 'Queued';
}

export function KivoExecutionSteps({ steps }: Props) {
  const safeSteps = normalizeSteps(steps);
  if (!safeSteps.length) return null;

  const activeIndex = safeSteps.findIndex((step) => step.status === 'running');

  return (
    <section className="my-[14px] overflow-hidden rounded-[24px] border border-black/[0.045] bg-white/58 p-[10px] shadow-[0_16px_34px_rgba(15,23,42,0.045)] backdrop-blur-xl">
      <div className="mb-[9px] flex items-center justify-between px-[4px]">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8c8d93]">Execution</div>
        <div className="text-[12px] font-medium tracking-[-0.01em] text-[#a1a2a8]">{safeSteps.filter((s) => s.status === 'done').length}/{safeSteps.length}</div>
      </div>

      <div className="space-y-[7px]">
        {safeSteps.map((step, index) => {
          const isActive = step.status === 'running';
          const isDone = step.status === 'done';
          const isOpen = isActive || (isDone && index === safeSteps.length - 1 && activeIndex === -1);

          return (
            <div
              key={step.id || `${step.title}-${index}`}
              className={`relative overflow-hidden rounded-[18px] px-[12px] py-[10px] transition-all duration-300 ease-out ${
                isActive
                  ? 'bg-white shadow-[0_12px_26px_rgba(15,23,42,0.065)] ring-1 ring-black/[0.055] scale-[1.01]'
                  : isDone
                    ? 'bg-[#f7f7f8] ring-1 ring-black/[0.035]'
                    : 'bg-[#f2f2f3]/72 ring-1 ring-black/[0.025] opacity-72'
              }`}
            >
              {isActive ? <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" /> : null}

              <div className="flex items-center gap-[10px]">
                <StepIcon step={step} />
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[15.5px] font-semibold leading-[1.22] tracking-[-0.035em] transition-colors ${isActive ? 'text-[#111113]' : isDone ? 'text-[#2c2d31]' : 'text-[#8d8e94]'}`}>
                    {step.title}
                  </div>
                  <div className={`mt-[2px] text-[12.5px] font-medium tracking-[-0.01em] transition-colors ${isActive ? 'text-[#6b6c72]' : 'text-[#a0a1a7]'}`}>
                    {statusLabel(step.status)}
                  </div>
                </div>
              </div>

              {step.detail && isOpen ? (
                <p className="mt-[8px] pl-[34px] text-[13.5px] leading-[1.42] tracking-[-0.02em] text-[#6b6c72] animate-[fadeIn_260ms_ease-out]">
                  {step.detail}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
