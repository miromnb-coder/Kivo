import { createSupabaseServer } from '@/lib/supabase/server';
import type { AgentMemoryContext } from './types';

type MemoryType = 'preference' | 'goal' | 'fact' | 'person' | 'project' | 'routine' | 'constraint';

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function inferMemoryType(content: string): MemoryType {
  const text = content.toLowerCase();

  if (text.includes('goal') || text.includes('haluan') || text.includes('tavoite')) return 'goal';
  if (text.includes('prefer') || text.includes('tykkään') || text.includes('pidän')) return 'preference';
  if (text.includes('every') || text.includes('aina') || text.includes('maanantaisin')) return 'routine';
  if (text.includes('cannot') || text.includes('en voi') || text.includes('constraint')) return 'constraint';
  if (text.includes('project') || text.includes('kivo')) return 'project';

  return 'fact';
}

export async function getMemoryContext(userId?: string, message?: string): Promise<AgentMemoryContext> {
  if (!userId) {
    return { profileSummary: '', preferences: [], recentContext: [] };
  }

  const supabase = createSupabaseServer();
  const queryText = toText(message).toLowerCase();

  const { data: profile } = await supabase
    .from('kivo_profiles')
    .select('display_name, language, timezone')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: memories } = await supabase
    .from('kivo_memories')
    .select('content, type, importance')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(12);

  const relevantMemories = (memories ?? []).filter((memory) => {
    if (!queryText) return true;
    const content = String(memory.content).toLowerCase();
    return content.split(/\s+/).some((word) => word.length > 3 && queryText.includes(word));
  });

  const selectedMemories = (relevantMemories.length ? relevantMemories : memories ?? []).slice(0, 8);

  const { data: goals } = await supabase
    .from('kivo_goals')
    .select('title, description, priority')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .limit(5);

  const { data: people } = await supabase
    .from('kivo_people')
    .select('name, relationship, notes, importance')
    .eq('user_id', userId)
    .order('importance', { ascending: false })
    .limit(5);

  const { data: runs } = await supabase
    .from('kivo_agent_runs')
    .select('message, answer, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const profileParts = [
    profile?.display_name ? `Name: ${profile.display_name}` : '',
    profile?.language ? `Language: ${profile.language}` : '',
    profile?.timezone ? `Timezone: ${profile.timezone}` : '',
  ].filter(Boolean);

  return {
    profileSummary: profileParts.join(' | '),
    preferences: [
      ...selectedMemories.map((m) => `[${m.type}] ${m.content}`),
      ...(goals ?? []).map((g) => `[goal] ${g.title}${g.description ? ` — ${g.description}` : ''}`),
      ...(people ?? []).map((p) => `[person] ${p.name}${p.relationship ? ` — ${p.relationship}` : ''}${p.notes ? ` — ${p.notes}` : ''}`),
    ],
    recentContext: (runs ?? []).map((r) => `User: ${r.message}${r.answer ? ` | Kivo: ${String(r.answer).slice(0, 220)}` : ''}`),
  };
}

export async function saveAgentRun(userId: string, message: string, answer: string, meta?: { agent?: string; mode?: string; context?: string; model?: string; provider?: string; steps?: unknown[]; structuredData?: unknown }) {
  const supabase = createSupabaseServer();

  await supabase.from('kivo_agent_runs').insert({
    user_id: userId,
    message,
    answer,
    agent: meta?.agent ?? 'kivo',
    mode: meta?.mode ?? 'chat',
    context: meta?.context ?? 'general',
    model: meta?.model,
    provider: meta?.provider,
    steps: meta?.steps ?? [],
    structured_data: meta?.structuredData ?? {},
    status: 'done',
  });
}

export async function saveMemory(userId: string, content: string, type?: MemoryType, importance = 3) {
  const clean = content.trim();
  if (!clean) return;

  const supabase = createSupabaseServer();

  await supabase.from('kivo_memories').insert({
    user_id: userId,
    content: clean,
    type: type ?? inferMemoryType(clean),
    importance,
    source: 'chat',
  });
}

export async function ensureProfile(userId: string, displayName?: string) {
  const supabase = createSupabaseServer();

  await supabase.from('kivo_profiles').upsert({
    user_id: userId,
    display_name: displayName ?? null,
    language: 'fi',
    timezone: 'Europe/Helsinki',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
