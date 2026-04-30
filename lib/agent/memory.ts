import type { AgentMemoryContext } from './types';

export async function getMemoryContext(userId?: string): Promise<AgentMemoryContext> {
  // Placeholder (later: Supabase / DB)
  return {
    profileSummary: 'User is building Kivo AI operator',
    preferences: ['minimal UI', 'fast responses'],
    recentContext: [],
  };
}

export async function saveMemory() {
  // TODO later
}
