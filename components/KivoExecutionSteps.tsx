'use client';

import { Check, ChevronDown, FileText, Globe2, Loader2, MousePointer2, PenLine, Search, Sparkles } from 'lucide-react';

export type KivoExecutionStep = {
  id?: string;
  title?: string;
  label?: string;
  detail?: string;
  status?: 'pending' | 'queued' | 'running' | 'active' | 'done' | 'completed';
  kind?: 'search' | 'plan' | 'write' | 'tool' | 'think' | 'browser' | 'read' | 'click' | 'done';
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
      const status = rawStatus === 'completed' ? 'done' : rawStatus === 'active' ? 'running' : rawStatus === 'queued' ? 'pending' : rawStatus;
      const kind = step.kind ?? 'think';
      const id = typeof step.id === 'string' ? step.id : title;

      return { id, title, detail, status, kind };
    })
    .filter((step) => step.title.length > 0)
    .slice(0, 7);
}

function PendingIcon({ kind }: { kind: KivoExecutionStep['kind'] }) {
  if (kind === 'browser') return <Globe2 size={15} strokeWidth={2.2} />;
  if (kind === 'search') return <Search size={15} strokeWidth={2.2} />;
  if (kind === 'read') return <FileText size={15} strokeWidth={2.2} />;
  if (kind === 'click' || kind === 'tool') return <MousePointer2 size={15} strokeWidth={2.2} />;
  if (kind === 'write') return <PenLine size={15} strokeWidth={2.2} />;
  if (kind === 'plan') return <FileText size={15} strokeWidth={2.2} />;
  return <Sparkles size={15} strokeWidth={2.2} />;
}

function StepIcon({ step }: { step: ReturnType<typeof normalizeSteps>[number] }) {
  if (step.status === 'done') {
    return (
      <span className="relative z-10 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#111114] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-300">
        <Check size={17} strokeWidth={2.7} />
      </span>
    );
  }

  if (step.status === 'running') {
    return (
      <span className="relative z-10 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white text-[#111114] shadow-[0_12px_28px_rgba(15,23,42,0.13)] ring-1 ring-black/[0.06] transition-all duration-300">
        <span className="absolute inset-[-5px] rounded-full bg-[#2563eb]/10 blur-[6px] animate-pulse" />
        <Loader2 size={16} strokeWidth={2.4} className="relative animate-spin" />
      </span>
    );
  }

  return (
    <span className="relative z-10 flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#f1f1f3] text-[#9899a1] ring-1 ring-black/[0.035] transition-all duration-300">
      <PendingIcon kind={step.kind} />
    </span>
  );
}

function statusLabel(status: string) {
  if (status === 'done') return 'Done';
  if (status === 'running') return 'In progress';
  return 'Pending';
}

function getHeaderTitle(steps: ReturnType<typeof normalizeSteps>) {
  const active = steps.find((step) => step.status === 'running');
  if (active?.kind === 'browser' || active?.kind === 'search' || steps.some((step) => step.kind === 'browser' || step.kind === 'search')) return 'Browsing the web';
  return 'Kivo is working';
}

function getHeaderSubtitle(steps: ReturnType<typeof normalizeSteps>) {
  const active = steps.find((step) => step.status === 'running');
  if (active?.detail) return active.detail;
  if (active?.title) return active.title;
  return 'Following the task step by step';
}

export function KivoExecutionSteps({ steps }: Props) {
  const safeSteps = normalizeSteps(steps);
  if (!safeSteps.length) return null;

  const doneCount = safeSteps.filter((s) => s.status === 'done').length;
  const hasRunning = safeSteps.some((s) => s.status === 'running');
  const headerTitle = getHeaderTitle(safeSteps);
  const headerSubtitle = getHeaderSubtitle(safeSteps);

  return (
    <section className="my-[16px] overflow-hidden rounded-[28px] border border-black/[0.055] bg-white/78 p-[16px] shadow-[0_20px_55px_rgba(15,23,42,0.065)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-[12px] border-b border-black/[0.055] pb-[14px]">
        <div className="flex min-w-0 items-start gap-[12px]">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[16px] bg-[#f0f0ff] text-[#111114] ring-1 ring-black/[0.035]">
            <Globe2 size={21} strokeWidth={2.05} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[19px] font-semibold leading-[1.12] tracking-[-0.045em] text-[#141518]">{headerTitle}</div>
            <div className="mt-[4px] line-clamp-2 text-[14.5px] leading-[1.25] tracking-[-0.025em] text-[#666771]">{headerSubtitle}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-[8px] rounded-full bg-[#f4f4f5] px-[11px] py-[7px] text-[13.5px] font-semibold tracking-[-0.02em] text-[#4f5058]">
          <span className={`h-[8px] w-[8px] rounded-full ${hasRunning ? 'bg-[#2563eb] animate-pulse' : 'bg-[#58a96b]'}`} />
          {hasRunning ? 'In progress' : 'Done'}
          <ChevronDown size={15} strokeWidth={2.2} />
        </div>
      </div>

      <div className="relative mt-[16px] space-y-[0px]">
        <div className="absolute left-[16px] top-[34px] bottom-[34px] w-px bg-gradient-to-b from-black/[0.06] via-black/[0.08] to-transparent" />

        {safeSteps.map((step, index) => {
          const isActive = step.status === 'running';
          const isDone = step.status === 'done';

          return (
            <div key={step.id || `${step.title}-${index}`} className="relative flex gap-[13px] py-[9px]">
              <StepIcon step={step} />
              <div className="min-w-0 flex-1 pt-[2px]">
                <div className={`truncate text-[16px] font-semibold leading-[1.18] tracking-[-0.035em] transition-colors ${isActive ? 'text-[#111114]' : isDone ? 'text-[#2d2e33]' : 'text-[#8e8f97]'}`}>
                  {step.title}
                </div>
                <div className={`mt-[4px] text-[13.5px] font-medium tracking-[-0.02em] transition-colors ${isActive ? 'text-[#6a6b73]' : 'text-[#9d9ea6]'}`}>
                  {step.detail || statusLabel(step.status)}
                </div>
              </div>
              <div className="flex w-[26px] shrink-0 items-start justify-end pt-[4px]">
                {isDone ? <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full bg-[#58a96b] text-white"><Check size={13} strokeWidth={2.6} /></span> : isActive ? <span className="h-[19px] w-[19px] rounded-full border-[3px] border-[#2563eb]/25 border-t-[#2563eb] animate-spin" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-[14px] flex items-center justify-between border-t border-black/[0.045] pt-[13px] text-[13.5px] tracking-[-0.025em] text-[#6c6d75]">
        <span>{doneCount}/{safeSteps.length} steps completed</span>
        <span>{hasRunning ? 'Working live' : 'Ready'}</span>
      </div>
    </section>
  );
}
