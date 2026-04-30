import type { AgentIntent, AgentPlan, AgentStep } from './types';

function stepsForIntent(intent: AgentIntent): AgentStep[] {
  const base: AgentStep[] = [
    { id: 'understand', label: 'Understanding your request', status: 'pending' },
    { id: 'context', label: 'Checking personal context', status: 'pending' },
  ];

  if (intent === 'plan') {
    return [
      ...base,
      { id: 'prioritize', label: 'Prioritizing tasks', status: 'pending' },
      { id: 'compose', label: 'Building a clear plan', status: 'pending' },
    ];
  }

  if (intent === 'research') {
    return [
      ...base,
      { id: 'scope', label: 'Defining research scope', status: 'pending' },
      { id: 'synthesize', label: 'Synthesizing answer', status: 'pending' },
    ];
  }

  if (intent === 'finance') {
    return [
      ...base,
      { id: 'scan', label: 'Looking for money signals', status: 'pending' },
      { id: 'recommend', label: 'Preparing recommendations', status: 'pending' },
    ];
  }

  if (intent === 'personal_operator') {
    return [
      ...base,
      { id: 'actions', label: 'Mapping possible actions', status: 'pending' },
      { id: 'confirm', label: 'Preparing safe next step', status: 'pending' },
    ];
  }

  return [
    ...base,
    { id: 'answer', label: 'Preparing answer', status: 'pending' },
  ];
}

export function createPlan(intent: AgentPlan['intent'], message: string): AgentPlan {
  return {
    intent,
    summary: `Kivo is handling a ${intent} request`,
    needsTools: intent !== 'chat',
    steps: stepsForIntent(intent),
  };
}
