import type { AgentIntent } from './types';

type IntentScore = {
  intent: AgentIntent;
  score: number;
};

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

function hasAny(text: string, signals: string[]) {
  return signals.some((signal) => text.includes(signal));
}

function countMatches(text: string, signals: string[]) {
  return signals.reduce((score, signal) => score + (text.includes(signal) ? 1 : 0), 0);
}

function looksLikeUrlOrResearchTarget(text: string) {
  return (
    text.includes('http://') ||
    text.includes('https://') ||
    text.includes('www.') ||
    text.includes('.com') ||
    text.includes('.dev') ||
    text.includes('.app') ||
    text.includes('.ai') ||
    text.includes('github.com')
  );
}

function looksLikeCodeOrProjectWork(text: string) {
  return (
    text.includes('.ts') ||
    text.includes('.tsx') ||
    text.includes('.js') ||
    text.includes('.jsx') ||
    text.includes('.sql') ||
    text.includes('api/') ||
    text.includes('lib/') ||
    text.includes('app/') ||
    text.includes('components/') ||
    text.includes('supabase') ||
    text.includes('vercel') ||
    text.includes('github') ||
    text.includes('next.js') ||
    text.includes('typescript') ||
    text.includes('react')
  );
}

function scoreIntent(message: string): IntentScore[] {
  const text = normalizeText(message);

  const scores: IntentScore[] = [
    { intent: 'chat', score: 1 },
    { intent: 'plan', score: 0 },
    { intent: 'research', score: 0 },
    { intent: 'finance', score: 0 },
    { intent: 'personal_operator', score: 0 },
    { intent: 'calendar', score: 0 },
    { intent: 'email', score: 0 },
    { intent: 'memory', score: 0 },
    { intent: 'project', score: 0 },
    { intent: 'settings', score: 0 },
  ];

  function add(intent: AgentIntent, value: number) {
    const target = scores.find((item) => item.intent === intent);
    if (target) target.score += value;
  }

  const planningSignals = [
    'plan',
    'roadmap',
    'schedule',
    'todo',
    'task',
    'tasks',
    'next step',
    'priority',
    'priorities',
    'strategy',
    'timeline',
    'routine',
  ];

  const researchSignals = [
    'research',
    'compare',
    'find',
    'search',
    'lookup',
    'source',
    'sources',
    'latest',
    'current',
    'available',
    'price',
    'review',
  ];

  const financeSignals = [
    'money',
    'budget',
    'finance',
    'subscription',
    'invoice',
    'bill',
    'payment',
    'receipt',
    'spending',
    'cost',
    'price',
    'renewal',
  ];

  const operatorSignals = [
    'do this for me',
    'handle',
    'take care',
    'manage',
    'execute',
    'create event',
    'send email',
    'book',
    'schedule this',
    'add to calendar',
  ];

  const calendarSignals = [
    'calendar',
    'meeting',
    'event',
    'appointment',
    'availability',
    'free time',
    'schedule',
    'today',
    'tomorrow',
  ];

  const emailSignals = [
    'email',
    'mail',
    'gmail',
    'outlook',
    'inbox',
    'message',
    'messages',
    'unread',
    'reply',
  ];

  const memorySignals = [
    'memory',
    'remember',
    'forget',
    'profile',
    'preference',
    'preferences',
    'what do you know about me',
  ];

  const settingsSignals = [
    'settings',
    'setting',
    'theme',
    'language',
    'timezone',
    'notifications',
    'privacy',
    'account',
    'profile',
  ];

  add('plan', countMatches(text, planningSignals) * 3);
  add('research', countMatches(text, researchSignals) * 3);
  add('finance', countMatches(text, financeSignals) * 4);
  add('personal_operator', countMatches(text, operatorSignals) * 5);
  add('calendar', countMatches(text, calendarSignals) * 4);
  add('email', countMatches(text, emailSignals) * 4);
  add('memory', countMatches(text, memorySignals) * 5);
  add('settings', countMatches(text, settingsSignals) * 4);

  if (looksLikeUrlOrResearchTarget(text)) add('research', 5);
  if (looksLikeCodeOrProjectWork(text)) add('project', 6);

  if (
    hasAny(text, [
      'build',
      'implement',
      'fix',
      'debug',
      'refactor',
      'replace file',
      'code',
      'component',
      'route',
      'database',
      'sql',
      'deploy',
      'repo',
      'repository',
      'app',
      'feature',
    ])
  ) {
    add('project', 5);
  }

  if (
    hasAny(text, [
      'create',
      'add',
      'delete',
      'rename',
      'update',
      'connect',
      'disconnect',
      'send',
      'save',
    ])
  ) {
    add('personal_operator', 2);
  }

  return scores;
}

export function routeIntent(message: string): AgentIntent {
  const text = normalizeText(message);

  if (!text) return 'chat';

  const ranked = scoreIntent(text).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score <= 1) return 'chat';

  if (best.intent === 'calendar' && second?.intent === 'personal_operator') {
    return second.score >= best.score - 1 ? 'personal_operator' : 'calendar';
  }

  if (best.intent === 'email' && second?.intent === 'personal_operator') {
    return second.score >= best.score - 1 ? 'personal_operator' : 'email';
  }

  return best.intent;
}
