import type { AgentIntent, AgentMemoryContext } from '../core/types';

export type ProactiveSuggestion = {
  id: string;
  label: string;
  reason: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category:
    | 'project'
    | 'planning'
    | 'memory'
    | 'email'
    | 'calendar'
    | 'finance'
    | 'learning'
    | 'style'
    | 'general';
};

type SuggestionInput = {
  id: string;
  label: string;
  reason: string;
  priority: number;
  category: ProactiveSuggestion['category'];
};

const MAX_SUGGESTIONS = 3;

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/@.:_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampPriority(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value === 2) return 2;
  if (value === 3) return 3;
  if (value === 4) return 4;
  return 5;
}

function buildMemoryText(memory: AgentMemoryContext) {
  return normalizeText(
    [
      memory.profileSummary,
      ...(memory.preferences ?? []),
      ...(memory.recentContext ?? []),
      ...(memory.insights ?? []),
      ...(memory.proactiveSuggestions ?? []),
      ...(memory.activeProjects ?? []),
      ...(memory.goals ?? []),
      ...(memory.routines ?? []),
      ...(memory.constraints ?? []),
      ...(memory.integrations ?? []),
    ].join(' '),
  );
}

function hasAny(text: string, signals: string[]) {
  return signals.some((signal) => text.includes(signal));
}

function addSuggestion(
  suggestions: SuggestionInput[],
  suggestion: SuggestionInput,
) {
  const existing = suggestions.find((item) => item.id === suggestion.id);

  if (!existing) {
    suggestions.push(suggestion);
    return;
  }

  existing.priority = Math.max(existing.priority, suggestion.priority);
}

function dedupeAndRank(suggestions: SuggestionInput[]): ProactiveSuggestion[] {
  const seen = new Set<string>();

  return suggestions
    .filter((suggestion) => {
      const key = normalizeText(`${suggestion.label} ${suggestion.reason}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_SUGGESTIONS)
    .map((suggestion) => ({
      ...suggestion,
      priority: clampPriority(suggestion.priority),
    }));
}

export function buildProactiveSuggestions(
  memory: AgentMemoryContext,
  intent: AgentIntent,
): ProactiveSuggestion[] {
  const suggestions: SuggestionInput[] = [];
  const memoryText = buildMemoryText(memory);

  if (!memoryText && intent === 'chat') return [];

  if (
    hasAny(memoryText, [
      'project',
      'building',
      'implementation',
      'feature',
      'repo',
      'repository',
      'github',
      'vercel',
      'supabase',
      'next.js',
      'typescript',
      'kivo',
    ]) ||
    intent === 'project'
  ) {
    addSuggestion(suggestions, {
      id: 'project-next-step',
      label: 'Choose one concrete next implementation step',
      reason: 'The user is actively building a project, so momentum matters.',
      priority: intent === 'project' ? 5 : 4,
      category: 'project',
    });
  }

  if (
    hasAny(memoryText, [
      'goal',
      'roadmap',
      'plan',
      'priority',
      'milestone',
      'task',
      'next step',
    ]) ||
    intent === 'plan'
  ) {
    addSuggestion(suggestions, {
      id: 'turn-plan-into-actions',
      label: 'Turn the answer into 2–3 concrete actions',
      reason: 'Planning is more useful when converted into clear next steps.',
      priority: intent === 'plan' ? 5 : 4,
      category: 'planning',
    });
  }

  if (
    hasAny(memoryText, [
      'calendar',
      'schedule',
      'routine',
      'meeting',
      'availability',
      'time block',
    ]) ||
    intent === 'calendar'
  ) {
    addSuggestion(suggestions, {
      id: 'schedule-aware-next-step',
      label: 'Suggest a schedule-aware next step',
      reason: 'The user benefits from planning around time, routines, or calendar context.',
      priority: intent === 'calendar' ? 5 : 4,
      category: 'calendar',
    });
  }

  if (
    hasAny(memoryText, [
      'email',
      'gmail',
      'outlook',
      'inbox',
      'message',
      'bill',
      'invoice',
      'payment',
      'receipt',
    ]) ||
    intent === 'email'
  ) {
    addSuggestion(suggestions, {
      id: 'email-action-items',
      label: 'Surface important email-related action items',
      reason: 'Email context can reveal bills, reminders, replies, and urgent items.',
      priority: intent === 'email' ? 5 : 4,
      category: 'email',
    });
  }

  if (
    hasAny(memoryText, [
      'finance',
      'money',
      'budget',
      'subscription',
      'spending',
      'cost',
      'renewal',
    ]) ||
    intent === 'finance'
  ) {
    addSuggestion(suggestions, {
      id: 'finance-risk-check',
      label: 'Highlight possible money leaks or renewals',
      reason: 'Finance requests are more valuable when they identify risk and next actions.',
      priority: intent === 'finance' ? 5 : 4,
      category: 'finance',
    });
  }

  if (
    hasAny(memoryText, [
      'learn',
      'learning',
      'study',
      'practice',
      'skill',
      'course',
      'coding',
    ])
  ) {
    addSuggestion(suggestions, {
      id: 'small-learning-session',
      label: 'Suggest a small learning session',
      reason: 'The user has learning-related context, so a small session can keep progress easy.',
      priority: 3,
      category: 'learning',
    });
  }

  if (
    hasAny(memoryText, [
      'short answer',
      'concise',
      'brief',
      'direct',
      'practical',
      'action-first',
    ])
  ) {
    addSuggestion(suggestions, {
      id: 'keep-answer-concise',
      label: 'Keep the answer concise and action-first',
      reason: 'The user prefers practical, direct responses.',
      priority: 3,
      category: 'style',
    });
  }

  if (intent === 'memory') {
    addSuggestion(suggestions, {
      id: 'memory-review',
      label: 'Offer to review or clean memory',
      reason: 'Memory requests are often improved by checking what should be kept, merged, or removed.',
      priority: 5,
      category: 'memory',
    });
  }

  if (intent === 'personal_operator') {
    addSuggestion(suggestions, {
      id: 'confirm-before-action',
      label: 'Confirm action status clearly',
      reason: 'Operator tasks must distinguish between suggested actions and completed actions.',
      priority: 5,
      category: 'general',
    });
  }

  return dedupeAndRank(suggestions);
}

export function buildProactivePrompt(suggestions: ProactiveSuggestion[]) {
  if (!suggestions.length) {
    return [
      'Proactive guidance:',
      '- No proactive suggestion is needed unless it clearly helps the current answer.',
      '- Do not add generic advice.',
    ].join('\n');
  }

  return [
    'Proactive guidance:',
    ...suggestions.map(
      (suggestion) =>
        `- ${suggestion.label} | Reason: ${suggestion.reason} | Priority: ${suggestion.priority}`,
    ),
    '',
    'Rules:',
    '- Use at most one proactive suggestion in the final answer.',
    '- Keep it subtle, useful, and directly related to the user request.',
    '- Do not mention that this came from a proactive system.',
    '- Never claim an action was completed unless a verified tool result confirms success.',
  ].join('\n');
}
