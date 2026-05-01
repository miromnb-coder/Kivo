import type { AgentIntent, AgentMemoryContext } from './types';

export type ProactiveSuggestion = {
  id: string;
  label: string;
  reason: string;
  priority: 1 | 2 | 3 | 4 | 5;
};

export function buildProactiveSuggestions(memory: AgentMemoryContext, intent: AgentIntent): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = [];
  const combined = [...memory.preferences, ...(memory.insights ?? []), ...(memory.proactiveSuggestions ?? [])].join(' ').toLowerCase();

  if (combined.includes('learn') || combined.includes('oppia') || combined.includes('kood')) {
    suggestions.push({
      id: 'daily-learning-session',
      label: 'Start a short learning session today',
      reason: 'Your memory suggests an active learning goal.',
      priority: 4,
    });
  }

  if (combined.includes('project') || combined.includes('kivo')) {
    suggestions.push({
      id: 'project-next-step',
      label: 'Choose one concrete next step for Kivo',
      reason: 'You are actively building a project and benefit from momentum.',
      priority: 5,
    });
  }

  if (combined.includes('short') || combined.includes('concise')) {
    suggestions.push({
      id: 'keep-answer-short',
      label: 'Keep this answer short and action-first',
      reason: 'You prefer concise answers.',
      priority: 3,
    });
  }

  if (intent === 'plan') {
    suggestions.push({
      id: 'turn-plan-into-actions',
      label: 'Turn the plan into 2–3 concrete actions',
      reason: 'Planning requests are more useful when converted into clear next steps.',
      priority: 4,
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export function buildProactivePrompt(suggestions: ProactiveSuggestion[]) {
  if (!suggestions.length) return 'No proactive suggestion is needed unless the user asks for one.';

  return [
    'Proactive guidance:',
    ...suggestions.map((s) => `- ${s.label} (${s.reason})`),
    'Use at most one proactive suggestion in the final answer. Keep it subtle and helpful.',
  ].join('\n');
}
