'use client';

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

const ENABLE_KIVO_EXECUTION_STEPS = false;

export function KivoExecutionSteps({ steps: _steps }: Props) {
  if (!ENABLE_KIVO_EXECUTION_STEPS) return null;

  return null;
}
