import type { AgentIntent } from './types';

export function routeIntent(message: string): AgentIntent {
  const m = message.toLowerCase();

  if (m.includes('schedule') || m.includes('plan') || m.includes('todo')) {
    return 'plan';
  }

  if (m.includes('research') || m.includes('compare') || m.includes('find')) {
    return 'research';
  }

  if (m.includes('money') || m.includes('budget') || m.includes('subscription')) {
    return 'finance';
  }

  if (m.includes('do this for me') || m.includes('handle')) {
    return 'personal_operator';
  }

  return 'chat';
}
