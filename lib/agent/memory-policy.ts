import type { AgentIntent, AgentMemoryContext } from './types';

export function buildMemoryBrief(memory: AgentMemoryContext, intent: AgentIntent) {
  const lines: string[] = [];

  if (memory.profileSummary) {
    lines.push(`Profile: ${memory.profileSummary}`);
  }

  if (memory.preferences.length) {
    lines.push('Relevant long-term memory:');
    for (const item of memory.preferences.slice(0, 10)) {
      lines.push(`- ${item}`);
    }
  }

  if (memory.recentContext.length) {
    lines.push('Recent context:');
    for (const item of memory.recentContext.slice(0, 4)) {
      lines.push(`- ${item}`);
    }
  }

  if (!lines.length) {
    return 'No reliable memory yet. Do not pretend to know the user.';
  }

  return [
    'Use this memory only when it is relevant to the current request.',
    'Do not mention memory unless it helps the answer feel more personal.',
    'Never invent personal facts that are not in memory.',
    intent === 'plan' ? 'For planning, adapt suggestions to goals, routines, and constraints.' : '',
    intent === 'finance' ? 'For finance, use only stored finance-related memories and avoid assumptions.' : '',
    lines.join('\n'),
  ].filter(Boolean).join('\n');
}

export function shouldUseMemory(memory: AgentMemoryContext) {
  return Boolean(memory.profileSummary || memory.preferences.length || memory.recentContext.length);
}
