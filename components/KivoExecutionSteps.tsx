'use client';

import { useState } from 'react';
import { Check, ChevronUp, FileText, Globe2, Loader2, MousePointer2, PenLine, Search, Sparkles } from 'lucide-react';

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

function StepStatusDot({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <span className="mt-[4px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#c9c9cc] text-white">
        <Check size={12} strokeWidth={2.7} />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="mt-[6px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#d7d7db] bg-transparent">
        <span className="h-[8px] w-[8px] rounded-full bg-[#2b8cff] shadow-[0_0_10px_rgba(43,140,255,0.55)] animate-pulse" />
      </span>
    );
  }

  return <span className="mt-[6px] h-[18px] w-[18px] shrink-0 rounded-full border-[2px] border-[#d5d5d9] bg-transparent" />;
}

function ToolIcon({ kind }: { kind: KivoExecutionStep['kind'] }) {
  if (kind === 'browser') return <Globe2 size={15} strokeWidth={2.1} />;
  if (kind === 'search') return <Search size={15} strokeWidth={2.1} />;
  if (kind === 'read') return <FileText size={15} strokeWidth={2.1} />;
  if (kind === 'click' || kind === 'tool') return <MousePointer2 size={15} strokeWidth={2.1} />;
  if (kind === 'write') return <PenLine size={15} strokeWidth={2.1} />;
  if (kind === 'plan') return <FileText size={15} strokeWidth={2.1} />;
  return <Sparkles size={15} strokeWidth={2.1} />;
}

function toolLabel(step: ReturnType<typeof normalizeSteps>[number]) {
  if (step.kind === 'search' || step.kind === 'browser') return step.title;
  if (step.kind === 'tool') return step.title;
  if (step.kind === 'read') return step.title;
  if (step.kind === 'write') return step.title;
  return step.detail || step.title;
}

function ActiveStatusLabel({ kind }: { kind: KivoExecutionStep['kind'] }) {
  if (kind === 'browser' || kind === 'search') return <>Thinking</>;
  if (kind === 'tool' || kind === 'click') return <>Using terminal</>;
  if (kind === 'read') return <>Reading</>;
  if (kind === 'write') return <>Writing</>;
  return <>Thinking</>;
}

export function KivoExecutionSteps({ steps }: Props) {
  const safeSteps = normalizeSteps(steps);
  const [open, setOpen] = useState(true);

  if (!safeSteps.length) return null;

  const primaryStep = safeSteps.find((step) => step.status === 'running') ?? safeSteps[0];
  const detailStep = safeSteps.find((step) => step.detail) ?? primaryStep;
  const activeStep = safeSteps.find((step) => step.status === 'running');

  return (
    <section className="my-[14px] text-[#202024]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-[10px] text-left active:scale-[0.995]"
        aria-expanded={open}
      >
        <StepStatusDot status={primaryStep.status} />
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-semibold leading-[1.24] tracking-[-0.035em] text-[#252529]">
            {primaryStep.title}
          </div>
        </div>
        <ChevronUp className={`mt-[6px] h-[18px] w-[18px] shrink-0 text-[#9a9aa0] transition-transform duration-200 ${open ? '' : 'rotate-180'}`} strokeWidth={2.1} />
      </button>

      {open ? (
        <div className="ml-[42px] mt-[12px] space-y-[11px]">
          {detailStep.detail ? (
            <p className="text-[15.5px] leading-[1.45] tracking-[-0.02em] text-[#6f7077]">
              {detailStep.detail}
            </p>
          ) : null}

          {safeSteps.slice(0, 4).map((step, index) => {
            const isResultCard = index === 0 && (step.kind === 'tool' || step.kind === 'browser' || step.kind === 'search');

            if (isResultCard && step.status === 'running') {
              return (
                <div key={step.id || `${step.title}-${index}`} className="flex min-h-[58px] items-center gap-[12px] rounded-[17px] bg-white px-[14px] py-[10px] text-[#252529] shadow-[0_1px_0_rgba(0,0,0,0.035)] ring-1 ring-black/[0.045]">
                  <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center text-[#8b8c92]">
                    <ToolIcon kind={step.kind} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.03em]">{step.title}</span>
                  <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-[#8b8c92]" strokeWidth={2.2} />
                </div>
              );
            }

            return (
              <div key={step.id || `${step.title}-${index}`} className="inline-flex max-w-full items-center gap-[8px] rounded-full bg-[#eeeeef] px-[12px] py-[7px] text-[14.5px] font-medium leading-none tracking-[-0.025em] text-[#696a71] ring-1 ring-black/[0.035]">
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#8b8c92]">
                  <ToolIcon kind={step.kind} />
                </span>
                <span className="truncate">{toolLabel(step)}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {activeStep ? (
        <div className="ml-[42px] mt-[13px] flex items-center gap-[10px] text-[16.5px] leading-none tracking-[-0.025em] text-[#8a8b92]">
          <span className="h-[10px] w-[10px] rounded-[3px] bg-[#2b8cff] shadow-[0_0_10px_rgba(43,140,255,0.48)] animate-pulse" />
          <ActiveStatusLabel kind={activeStep.kind} />
        </div>
      ) : null}
    </section>
  );
}
