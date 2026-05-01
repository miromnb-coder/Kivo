import { createSupabaseServer } from '@/lib/supabase/server';
import type { AgentMemoryContext } from './types';

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildInsights(memories: string[]) {
  const insights: string[] = [];

  const hasShortPref = memories.some((m) => m.toLowerCase().includes('short'));
  if (hasShortPref) {
    insights.push('User prefers concise answers → keep responses short and direct.');
  }

  const hasRoutine = memories.some((m) => m.toLowerCase().includes('maanant'));
  if (hasRoutine) {
    insights.push('User has recurring routines → consider schedule-aware suggestions.');
  }

  return insights;
}

function buildProactiveSuggestions(memories: string[]) {
  const suggestions: string[] = [];

  if (memories.some((m) => m.toLowerCase().includes('learn') || m.toLowerCase().includes('oppia'))) {
    suggestions.push('Suggest small daily learning sessions.');
  }

  if (memories.some((m) => m.toLowerCase().includes('project') || m.toLowerCase().includes('kivo'))) {
    suggestions.push('Suggest progress check or next step for active projects.');
  }

  return suggestions;
}

export async function getMemoryContext(userId?: string, message?: string): Promise<AgentMemoryContext> {
  if (!userId) {
    return { profileSummary: '', preferences: [], recentContext: [], insights: [], proactiveSuggestions: [] };
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

  const selectedMemories = (memories ?? []).slice(0, 8);

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

  const memoryTexts = selectedMemories.map((m) => String(m.content));

  const profileParts = [
    profile?.display_name ? `Name: ${profile.display_name}` : '',
    profile?.language ? `Language: ${profile.language}` : '',
    profile?.timezone ? `Timezone: ${profile.timezone}` : '',
  ].filter(Boolean);

  const preferences = [
    ...selectedMemories.map((m) => `[${m.type}] ${m.content}`),
    ...(goals ?? []).map((g) => `[goal] ${g.title}${g.description ? ` — ${g.description}` : ''}`),
    ...(people ?? []).map((p) => `[person] ${p.name}${p.relationship ? ` — ${p.relationship}` : ''}${p.notes ? ` — ${p.notes}` : ''}`),
  ];

  return {
    profileSummary: profileParts.join(' | '),
    preferences,
    recentContext: (runs ?? []).map((r) => `User: ${r.message}${r.answer ? ` | Kivo: ${String(r.answer).slice(0, 220)}` : ''}`),
    insights: buildInsights(memoryTexts),
    proactiveSuggestions: buildProactiveSuggestions(memoryTexts),
  };
}

export async function saveAgentRun(userId: string, message: string, answer: string, meta?: any) {
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

export async function saveMemory(userId: string, content: string, type?: any, importance = 3) {
  const clean = content.trim();
  if (!clean) return;

  const supabase = createSupabaseServer();

  await supabase.from('kivo_memories').insert({
    user_id: userId,
    content: clean,
    type: type ?? 'fact',
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
