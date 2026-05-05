import type { AgentIntent, AgentMemoryContext } from './types';

const MAX_PROFILE_CHARS = 260;
const MAX_MEMORY_ITEMS = 12;
const MAX_RECENT_ITEMS = 4;
const MAX_INSIGHTS = 5;
const MAX_PROACTIVE_SUGGESTIONS = 4;

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function compactText(value: unknown, max = 320) {
  return toText(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueCleanItems(items: string[], maxItems: number, maxChars = 320) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const clean = compactText(item, maxChars);
    const key = normalizeText(clean);

    if (!clean || !key || seen.has(key)) continue;

    seen.add(key);
    output.push(clean);

    if (output.length >= maxItems) break;
  }

  return output;
}

function hasUsefulMemory(memory: AgentMemoryContext) {
  return Boolean(
    toText(memory.profileSummary) ||
      memory.preferences?.length ||
      memory.recentContext?.length ||
      memory.insights?.length ||
      memory.proactiveSuggestions?.length,
  );
}

function intentGuidance(intent: AgentIntent) {
  switch (intent) {
    case 'plan':
      return 'For planning, adapt suggestions to stored goals, routines, constraints, active projects, and schedule preferences.';
    case 'finance':
      return 'For finance, use only stored finance-related memories and connected tool context. Do not guess balances, transactions, prices, or subscriptions.';
    case 'research':
      return 'For research, use memory only to personalize scope and preferences. Do not treat memory as an external source.';
    case 'personal_operator':
      return 'For personal-operator tasks, combine relevant preferences, goals, routines, constraints, and recent context into concrete next actions.';
    case 'chat':
    default:
      return 'For normal chat, use memory lightly and only when it clearly improves the response.';
  }
}

function buildSection(title: string, items: string[]) {
  if (!items.length) return '';

  return [title, ...items.map((item) => `- ${item}`)].join('\n');
}

export function buildMemoryBrief(memory: AgentMemoryContext, intent: AgentIntent) {
  if (!hasUsefulMemory(memory)) {
    return [
      'No reliable long-term memory is available yet.',
      'Do not pretend to know the user.',
      'Ask or infer only from the current conversation when needed.',
    ].join('\n');
  }

  const profile = compactText(memory.profileSummary, MAX_PROFILE_CHARS);

  const relevantMemories = uniqueCleanItems(
    memory.preferences ?? [],
    MAX_MEMORY_ITEMS,
    360,
  );

  const recentContext = uniqueCleanItems(
    memory.recentContext ?? [],
    MAX_RECENT_ITEMS,
    360,
  );

  const insights = uniqueCleanItems(
    memory.insights ?? [],
    MAX_INSIGHTS,
    260,
  );

  const proactiveSuggestions = uniqueCleanItems(
    memory.proactiveSuggestions ?? [],
    MAX_PROACTIVE_SUGGESTIONS,
    260,
  );

  const sections = [
    profile ? `Profile:\n- ${profile}` : '',
    buildSection('Relevant long-term memory:', relevantMemories),
    buildSection('Recent context:', recentContext),
    buildSection('Memory-derived insights:', insights),
    buildSection('Safe proactive suggestions:', proactiveSuggestions),
  ].filter(Boolean);

  return [
    'Private memory context for Kivo:',
    '',
    'Use this memory only when it is relevant to the current request.',
    'Do not mention memory unless it naturally helps the answer.',
    'Do not reveal raw memory system details to the user.',
    'Never invent personal facts, preferences, goals, events, people, or constraints that are not present here.',
    'If memory conflicts with the current user message, trust the current user message.',
    'If memory is outdated or uncertain, phrase it cautiously or ignore it.',
    'Do not use memory to make sensitive assumptions.',
    'Do not store or repeat secrets, credentials, tokens, passwords, payment details, or private keys.',
    intentGuidance(intent),
    '',
    sections.join('\n\n'),
  ].join('\n');
}

export function shouldUseMemory(memory: AgentMemoryContext) {
  return hasUsefulMemory(memory);
}
