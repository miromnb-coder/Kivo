import { createSupabaseServer } from '@/lib/supabase/server';
import type { AgentMemoryContext } from './types';

type MemoryType =
  | 'preference'
  | 'fact'
  | 'personal_fact'
  | 'project'
  | 'goal'
  | 'routine'
  | 'constraint'
  | 'integration_status';

type MemoryRow = {
  id: string;
  type: string | null;
  content: string | null;
  importance: number | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GoalRow = {
  title: string | null;
  description?: string | null;
  priority?: number | null;
};

type PersonRow = {
  name: string | null;
  relationship?: string | null;
  notes?: string | null;
  importance?: number | null;
};

type AgentRunRow = {
  message: string | null;
  answer?: string | null;
  created_at?: string | null;
};

const MAX_MEMORY_CANDIDATES = 80;
const MAX_SELECTED_MEMORIES = 14;
const MAX_RECENT_RUNS = 5;

const ALLOWED_MEMORY_TYPES: MemoryType[] = [
  'preference',
  'fact',
  'personal_fact',
  'project',
  'goal',
  'routine',
  'constraint',
  'integration_status',
];

const FALLBACK_TYPE_MAP: Record<string, MemoryType> = {
  personal_fact: 'fact',
  project: 'goal',
  integration_status: 'constraint',
};

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function compactText(value: unknown, max = 260) {
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

function uniqueWords(text: string) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(' ')
        .filter((word) => word.length > 2),
    ),
  );
}

function clampImportance(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.max(1, Math.min(5, Math.round(number)));
}

function normalizeMemoryType(type?: unknown): MemoryType {
  const raw = toText(type).toLowerCase();

  if (ALLOWED_MEMORY_TYPES.includes(raw as MemoryType)) {
    return raw as MemoryType;
  }

  return 'fact';
}

function safeDbFallbackType(type: MemoryType): MemoryType {
  return FALLBACK_TYPE_MAP[type] ?? type;
}

function hasPersonalOrProjectSignal(content: string, type?: string | null) {
  const memoryType = normalizeMemoryType(type);

  if (
    memoryType === 'preference' ||
    memoryType === 'personal_fact' ||
    memoryType === 'project' ||
    memoryType === 'goal' ||
    memoryType === 'routine' ||
    memoryType === 'constraint' ||
    memoryType === 'integration_status'
  ) {
    return true;
  }

  const text = normalizeText(content);

  return [
    'user',
    'prefers',
    'likes',
    'wants',
    'needs',
    'uses',
    'building',
    'working on',
    'project',
    'goal',
    'routine',
    'schedule',
    'calendar',
    'email',
    'gmail',
    'outlook',
    'drive',
    'github',
    'vercel',
    'supabase',
    'kivo',
  ].some((signal) => text.includes(signal));
}

function isLikelyGenericWorldFact(content: string, type?: string | null) {
  const text = normalizeText(content);
  const memoryType = normalizeMemoryType(type);

  if (!text || text.length < 8) return true;

  if (memoryType !== 'fact') return false;
  if (hasPersonalOrProjectSignal(content, type)) return false;

  const genericDefinitionSignals = [
    ' is a ',
    ' is an ',
    ' are ',
    ' means ',
    ' refers to ',
    ' is defined as ',
    ' can be defined as ',
    ' is the process of ',
    ' is a type of ',
  ];

  return genericDefinitionSignals.some((signal) => ` ${text} `.includes(signal));
}

function isStaleIntegrationMemory(content: string) {
  const text = normalizeText(content);

  return [
    'not connected',
    'not linked',
    'not configured',
    'connection missing',
    'integration missing',
    'needs setup',
  ].some((signal) => text.includes(signal));
}

function calculateRecencyBoost(row: MemoryRow) {
  const date = row.updated_at ?? row.created_at;
  if (!date) return 0;

  const ageDays = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays < 3) return 10;
  if (ageDays < 14) return 6;
  if (ageDays < 45) return 3;
  return 0;
}

function calculateRelevance(content: string, query: string) {
  if (!query) return 0;

  const memoryWords = uniqueWords(content);
  const queryWords = uniqueWords(query);

  if (!memoryWords.length || !queryWords.length) return 0;

  let score = 0;

  for (const word of queryWords) {
    if (memoryWords.includes(word)) {
      score += 8;
    } else if (
      memoryWords.some((memoryWord) => memoryWord.includes(word) || word.includes(memoryWord))
    ) {
      score += 3;
    }
  }

  return Math.min(score, 35);
}

function typeBoost(type?: string | null) {
  const normalized = normalizeMemoryType(type);

  switch (normalized) {
    case 'preference':
      return 18;
    case 'project':
      return 16;
    case 'goal':
      return 14;
    case 'constraint':
      return 13;
    case 'integration_status':
      return 12;
    case 'routine':
      return 10;
    case 'personal_fact':
      return 8;
    case 'fact':
    default:
      return 0;
  }
}

function scoreMemory(row: MemoryRow, query: string) {
  const content = toText(row.content);
  const importance = clampImportance(row.importance);

  let score = importance * 14;
  score += typeBoost(row.type);
  score += calculateRelevance(content, query);
  score += calculateRecencyBoost(row);

  if (isStaleIntegrationMemory(content)) score -= 20;
  if (isLikelyGenericWorldFact(content, row.type)) score -= 35;

  return score;
}

function dedupeMemories(memories: MemoryRow[]) {
  const seen = new Set<string>();
  const output: MemoryRow[] = [];

  for (const memory of memories) {
    const key = `${normalizeMemoryType(memory.type)}:${normalizeText(memory.content)}`;
    if (!key || seen.has(key)) continue;

    seen.add(key);
    output.push(memory);
  }

  return output;
}

function formatMemory(memory: MemoryRow) {
  return `[${normalizeMemoryType(memory.type)}] ${compactText(memory.content, 320)}`;
}

function buildInsights(memories: MemoryRow[]) {
  const texts = memories.map((memory) => normalizeText(memory.content));
  const insights: string[] = [];

  if (texts.some((text) => text.includes('language'))) {
    insights.push('User has a language preference → match the preferred language when possible.');
  }

  if (
    texts.some(
      (text) =>
        text.includes('short') ||
        text.includes('concise') ||
        text.includes('brief') ||
        text.includes('direct'),
    )
  ) {
    insights.push('User prefers concise answers → keep responses practical and direct.');
  }

  if (texts.some((text) => text.includes('project') || text.includes('building') || text.includes('kivo'))) {
    insights.push('User is building an active project → preserve project context and suggest concrete next steps.');
  }

  if (texts.some((text) => text.includes('calendar') || text.includes('schedule') || text.includes('routine'))) {
    insights.push('User values schedule-aware help → use calendar and routine context when relevant.');
  }

  if (texts.some((text) => text.includes('email') || text.includes('gmail') || text.includes('outlook'))) {
    insights.push('User uses email integrations → consider messages, bills, reminders, and action items when relevant.');
  }

  return insights.slice(0, 5);
}

function buildProactiveSuggestions(memories: MemoryRow[]) {
  const texts = memories.map((memory) => normalizeText(memory.content));
  const suggestions: string[] = [];

  if (texts.some((text) => text.includes('project') || text.includes('building') || text.includes('kivo'))) {
    suggestions.push('Suggest the next concrete implementation step when the user is building.');
  }

  if (texts.some((text) => text.includes('calendar') || text.includes('schedule') || text.includes('routine'))) {
    suggestions.push('Offer planning or free-time suggestions when schedule context matters.');
  }

  if (texts.some((text) => text.includes('email') || text.includes('gmail') || text.includes('outlook'))) {
    suggestions.push('Use email context for bills, important messages, reminders, and action items.');
  }

  return suggestions.slice(0, 4);
}

function formatRecentRun(run: AgentRunRow) {
  const user = compactText(run.message, 160);
  const answer = compactText(run.answer, 220);

  if (!user) return '';
  return answer ? `User: ${user} | Kivo: ${answer}` : `User: ${user}`;
}

function looksSimilar(a: string, b: string) {
  const aNorm = normalizeText(a);
  const bNorm = normalizeText(b);

  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

  const aWords = new Set(uniqueWords(aNorm));
  const bWords = uniqueWords(bNorm);

  if (!aWords.size || !bWords.length) return false;

  const overlap = bWords.filter((word) => aWords.has(word)).length;
  return overlap / Math.max(aWords.size, bWords.length) >= 0.72;
}

export async function getMemoryContext(userId?: string, message?: string): Promise<AgentMemoryContext> {
  if (!userId) {
    return {
      profileSummary: '',
      preferences: [],
      recentContext: [],
      insights: [],
      proactiveSuggestions: [],
    };
  }

  const supabase = createSupabaseServer();
  const queryText = toText(message).toLowerCase();

  const [{ data: profile }, { data: memories }, { data: goals }, { data: people }, { data: runs }] =
    await Promise.all([
      supabase
        .from('kivo_profiles')
        .select('display_name, language, timezone')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('kivo_memories')
        .select('id, content, type, importance, source, created_at, updated_at')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(MAX_MEMORY_CANDIDATES),

      supabase
        .from('kivo_goals')
        .select('title, description, priority')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('priority', { ascending: false })
        .limit(5),

      supabase
        .from('kivo_people')
        .select('name, relationship, notes, importance')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .limit(5),

      supabase
        .from('kivo_agent_runs')
        .select('message, answer, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_RECENT_RUNS),
    ]);

  const rankedMemories = dedupeMemories((memories ?? []) as MemoryRow[])
    .map((memory) => ({
      memory,
      score: scoreMemory(memory, queryText),
    }))
    .filter(({ score }) => score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SELECTED_MEMORIES)
    .map(({ memory }) => memory);

  const profileParts = [
    profile?.display_name ? `Name: ${profile.display_name}` : '',
    profile?.language ? `Language: ${profile.language}` : '',
    profile?.timezone ? `Timezone: ${profile.timezone}` : '',
  ].filter(Boolean);

  const goalLines = ((goals ?? []) as GoalRow[])
    .filter((goal) => goal.title)
    .map((goal) => {
      const title = compactText(goal.title, 120);
      const description = goal.description ? ` — ${compactText(goal.description, 160)}` : '';
      return `[goal] ${title}${description}`;
    });

  const peopleLines = ((people ?? []) as PersonRow[])
    .filter((person) => person.name)
    .map((person) => {
      const parts = [
        `[person] ${compactText(person.name, 80)}`,
        person.relationship ? compactText(person.relationship, 80) : '',
        person.notes ? compactText(person.notes, 140) : '',
      ].filter(Boolean);

      return parts.join(' — ');
    });

  const preferences = [...rankedMemories.map(formatMemory), ...goalLines, ...peopleLines].slice(0, 22);

  const recentContext = ((runs ?? []) as AgentRunRow[])
    .map(formatRecentRun)
    .filter(Boolean);

  return {
    profileSummary: profileParts.join(' | '),
    preferences,
    recentContext,
    insights: buildInsights(rankedMemories),
    proactiveSuggestions: buildProactiveSuggestions(rankedMemories),
  };
}

export async function saveAgentRun(userId: string, message: string, answer: string, meta?: any) {
  const supabase = createSupabaseServer();

  await supabase.from('kivo_agent_runs').insert({
    user_id: userId,
    message: compactText(message, 4000),
    answer: compactText(answer, 8000),
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
  const clean = compactText(content, 700);
  if (!userId || !clean) return;

  const memoryType = normalizeMemoryType(type);
  const memoryImportance = clampImportance(importance);

  if (isLikelyGenericWorldFact(clean, memoryType)) return;

  const supabase = createSupabaseServer();

  const { data: existingMemories } = await supabase
    .from('kivo_memories')
    .select('id, content, type, importance, created_at, updated_at')
    .eq('user_id', userId)
    .eq('archived', false)
    .limit(80);

  const existing = ((existingMemories ?? []) as MemoryRow[]).find((memory) => {
    return normalizeMemoryType(memory.type) === memoryType && looksSimilar(clean, memory.content ?? '');
  });

  if (existing?.id) {
    await supabase
      .from('kivo_memories')
      .update({
        content: clean.length > toText(existing.content).length ? clean : existing.content,
        importance: Math.max(clampImportance(existing.importance), memoryImportance),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    return;
  }

  const insertPayload = {
    user_id: userId,
    content: clean,
    type: memoryType,
    importance: memoryImportance,
    source: 'chat',
    archived: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('kivo_memories').insert(insertPayload);

  if (!error) return;

  const fallbackType = safeDbFallbackType(memoryType);

  if (fallbackType !== memoryType) {
    await supabase.from('kivo_memories').insert({
      ...insertPayload,
      type: fallbackType,
    });
  }
}

export async function archiveBadMemories(userId: string) {
  if (!userId) return;

  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_memories')
    .select('id, content, type')
    .eq('user_id', userId)
    .eq('archived', false)
    .limit(200);

  const badIds = ((data ?? []) as MemoryRow[])
    .filter((memory) => {
      const content = memory.content ?? '';
      return isLikelyGenericWorldFact(content, memory.type) || isStaleIntegrationMemory(content);
    })
    .map((memory) => memory.id);

  if (!badIds.length) return;

  await supabase
    .from('kivo_memories')
    .update({
      archived: true,
      updated_at: new Date().toISOString(),
    })
    .in('id', badIds);
}

export async function ensureProfile(userId: string, displayName?: string) {
  if (!userId) return;

  const supabase = createSupabaseServer();

  await supabase.from('kivo_profiles').upsert(
    {
      user_id: userId,
      display_name: displayName ?? null,
      language: 'auto',
      timezone: 'Europe/Helsinki',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
