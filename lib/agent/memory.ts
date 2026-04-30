import { createSupabaseServer } from '@/lib/supabase/server';
import type { AgentMemoryContext } from './types';

export async function getMemoryContext(userId?: string): Promise<AgentMemoryContext> {
  if (!userId) {
    return {
      profileSummary: '',
      preferences: [],
      recentContext: [],
    };
  }

  const supabase = createSupabaseServer();

  const { data: profile } = await supabase
    .from('kivo_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: memories } = await supabase
    .from('kivo_memories')
    .select('content, type')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('importance', { ascending: false })
    .limit(5);

  const { data: runs } = await supabase
    .from('kivo_agent_runs')
    .select('message')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    profileSummary: profile?.display_name ?? '',
    preferences: memories?.map((m) => m.content) ?? [],
    recentContext: runs?.map((r) => r.message) ?? [],
  };
}

export async function saveAgentRun(userId: string, message: string, answer: string) {
  const supabase = createSupabaseServer();

  await supabase.from('kivo_agent_runs').insert({
    user_id: userId,
    message,
    answer,
  });
}

export async function saveMemory(userId: string, content: string) {
  const supabase = createSupabaseServer();

  await supabase.from('kivo_memories').insert({
    user_id: userId,
    content,
    type: 'fact',
  });
}
