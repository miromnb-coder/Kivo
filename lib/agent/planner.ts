import type { AgentPlan, AgentStep } from './types';

export function createPlan(intent: AgentPlan['intent'], message: string): AgentPlan {
  const steps: AgentStep[] = [
    { id: '1', label: 'Understand request', status: 'active' },
    { id: '2', label: 'Analyze context', status: 'pending' },
    { id: '3', label: 'Generate response', status: 'pending' },
  ];

  return {
    intent,
    summary: `Handling ${intent} request`,
    needsTools: false,
    steps,
  };
}
