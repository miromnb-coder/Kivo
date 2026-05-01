'use client';

import { Check, ChevronDown, Loader2, Search, Sparkles } from 'lucide-react';

export type KivoExecutionStep = {
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

      return { title, detail, status, kind };
    })
    .filter((step) => step.title.length > 0)
    .slice(0, 6);
}

function StepIcon({ step }: { step: ReturnType<typeof normalizeSteps>[number] }) {
  if (step.status === 'done') {
    return (
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#e8ece9] text-[#5a8b5d]">
        <Check size={14} strokeWidth={2.5} />
      </span>
    );
  }

  if (step.status === 'running') {
    return (
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#eeeeef] text-[#36373b]">
        <Loader2 size={14} strokeWidth={2.3} className="animate-spin" />
      </span>
    );
  }

  return (
    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#eeeeef] text-[#9a9ba1]">
      {step.kind === 'search' ? <Search size={13} strokeWidth={2.2} /> : <Sparkles size={13} strokeWidth={2.2} />}
    </span>
  );
}

export function KivoExecutionSteps({ steps }: Props) {
  const safeSteps = normalizeSteps(steps);
  if (!safeSteps.length) return null;

  return (
    <section className="my-[14px] space-y-[8px]">
      {safeSteps.map((step, index) => {
        const isOpen = step.status === 'running' || step.status === 'done';

        return (
          <div key={`${step.title}-${index}`} className="rounded-[18px] bg-[#f4f4f5]/82 px-[12px] py-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.035)]">
            <div className="flex items-center gap-[10px]">
              <StepIcon step={step} />
              <div className="min-w-0 flex-1 text-[15.5px] font-medium leading-[1.25] tracking-[-0.03em] text-[#2b2c30]">
                {step.title}
              </div>
              <ChevronDown size={15} strokeWidth={2.2} className={`shrink-0 text-[#8f9096] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {step.detail && isOpen ? (
              <p className="mt-[8px] pl-[32px] text-[13.5px] leading-[1.42] tracking-[-0.02em] text-[#707177]">
                {step.detail}
              </p>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
