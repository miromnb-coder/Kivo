import { createSupabaseServer } from '@/lib/supabase/server';
import type { AgentMemoryContext } from '../core/types';
import {
  generateAndStoreConversationSummaryEmbedding,
  generateAndStoreMemoryEmbedding,
  generateQueryEmbedding,
} from './memory-embedding';
import {
  formatMemoryRetrievalForPrompt,
  retrieveKivoMemories,
} from './memory-retrieval';
import {
  type JsonRecord,
  type KivoConversationSummaryInput,
  type KivoMemoryRow,
  type KivoMemoryScope,
  type KivoMemorySource,
  type KivoMemoryType,
  type KivoSaveMemoryInput,
  buildMemoryKey,
  clampMemoryConfidence,
  clampMemoryImportance,
  compactMemoryText,
  formatMemoryForPrompt,
  isActiveMemory,
  normalizeMemoryTags,
  normalizeMemoryText,
  normalizeMemoryType,
  safeMemoryMetadata,
  toMemoryText,
  uniqueMemoryWords,
} from './memory-types';

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

type ProfileRow = {
  display_name?: string | null;
  language?: string | null;
  timezone?: string | null;
};

export type GetMemoryContextOptions = {
  conversationId?: string;
  includeConversationContext?: boolean;
  includeConversationSummary?: boolean;
  recentMessageLimit?: number;
  finalMemoryLimit?: number;
};

const MAX_EXISTING_MEMORY_SCAN = 120;
const MAX_RECENT_RUNS = 5;
const MAX_PROFILE_LINES = 24;

const GENERIC_WORLD_FACT_PATTERNS = [
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

const STALE_INTEGRATION_SIGNALS = [
  'not connected',
  'not linked',
  'not configured',
  'connection missing',
  'integration missing',
  'needs setup',
];

function nowIso() {
  return new Date().toISOString();
}

function dbFallbackType(type: KivoMemoryType): KivoMemoryType {
  const fallback: Partial<Record<KivoMemoryType, KivoMemoryType>> = {
    personal_fact: 'fact',
    project: 'goal',
    integration_status: 'constraint',
  };

  return fallback[type] ?? type;
}

function hasPersonalOrProjectSignal(content: string, type?: unknown) {
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

  const text = normalizeMemoryText(content);

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

function isLikelyGenericWorldFact(content: string, type?: unknown) {
  const text = normalizeMemoryText(content);
  const memoryType = normalizeMemoryType(type);

  if (!text || text.length < 8) return true;
  if (memoryType !== 'fact') return false;
  if (hasPersonalOrProjectSignal(content, type)) return false;

  return GENERIC_WORLD_FACT_PATTERNS.some((signal) => ` ${text} `.includes(signal));
}

function isStaleIntegrationMemory(content: string) {
  const text = normalizeMemoryText(content);
  return STALE_INTEGRATION_SIGNALS.some((signal) => text.includes(signal));
}

function looksSimilar(a: string, b: string) {
  const aNorm = normalizeMemoryText(a);
  const bNorm = normalizeMemoryText(b);

  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

  const aWords = new Set(uniqueMemoryWords(aNorm));
  const bWords = uniqueMemoryWords(bNorm);

  if (!aWords.size || !bWords.length) return false;

  const overlap = bWords.filter((word) => aWords.has(word)).length;
  return overlap / Math.max(aWords.size, bWords.length) >= 0.72;
}

function formatRecentRun(run: AgentRunRow) {
  const user = compactMemoryText(run.message, 180);
  const answer = compactMemoryText(run.answer, 240);

  if (!user) return '';

  return answer ? `User: ${user} | Kivo: ${answer}` : `User: ${user}`;
}

function buildProfileSummary(profile?: ProfileRow | null) {
  const profileParts = [
    profile?.display_name ? `Name: ${profile.display_name}` : '',
    profile?.language ? `Language: ${profile.language}` : '',
    profile?.timezone ? `Timezone: ${profile.timezone}` : '',
  ].filter(Boolean);

  return profileParts.join(' | ');
}

function buildGoalLines(goals?: GoalRow[] | null) {
  return (goals ?? [])
    .filter((goal) => goal.title)
    .map((goal) => {
      const title = compactMemoryText(goal.title, 140);
      const description = goal.description ? ` — ${compactMemoryText(goal.description, 180)}` : '';
      return `[goal] ${title}${description}`;
    });
}

function buildPeopleLines(people?: PersonRow[] | null) {
  return (people ?? [])
    .filter((person) => person.name)
    .map((person) => {
      const parts = [
        `[person] ${compactMemoryText(person.name, 90)}`,
        person.relationship ? compactMemoryText(person.relationship, 90) : '',
        person.notes ? compactMemoryText(person.notes, 160) : '',
      ].filter(Boolean);

      return parts.join(' — ');
    });
}

function buildInsights(memoryTexts: string[]) {
  const texts = memoryTexts.map(normalizeMemoryText);
  const insights: string[] = [];

  if (texts.some((text) => text.includes('language'))) {
    insights.push('User has a language preference → match it when possible.');
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

function buildProactiveSuggestions(memoryTexts: string[]) {
  const texts = memoryTexts.map(normalizeMemoryText);
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

function buildMemoryMetadata(input: KivoSaveMemoryInput) {
  return {
    ...safeMemoryMetadata(input.metadata),
    memory_v: 3,
  };
}

function cleanMemoryInput(input: KivoSaveMemoryInput) {
  const content = compactMemoryText(input.content, 900);
  const type = normalizeMemoryType(input.type);
  const importance = clampMemoryImportance(input.importance);
  const confidence = clampMemoryConfidence(input.confidence);
  const title = compactMemoryText(input.title, 180) || null;
  const summary = compactMemoryText(input.summary, 420) || null;
  const tags = normalizeMemoryTags(input.tags);
  const memoryScope: KivoMemoryScope = input.memoryScope ?? 'long_term';
  const source: KivoMemorySource = input.source ?? 'chat';
  const memoryKey =
    compactMemoryText(input.memoryKey, 140) ||
    buildMemoryKey({
      userId: input.userId,
      type,
      title,
      content,
    });

  return {
    content,
    type,
    importance,
    confidence,
    title,
    summary,
    tags,
    memoryScope,
    source,
    memoryKey,
    entities: safeMemoryMetadata(input.entities),
    metadata: buildMemoryMetadata(input),
    visibility: input.visibility ?? 'private',
    sourceConversationId: toMemoryText(input.sourceConversationId) || null,
    sourceMessageId: toMemoryText(input.sourceMessageId) || null,
    expiresAt: input.expiresAt ?? null,
    relevanceHint: compactMemoryText(input.relevanceHint, 500) || null,
  };
}

async function findExistingSimilarMemory(userId: string, type: KivoMemoryType, content: string, memoryKey?: string) {
  const supabase = createSupabaseServer();

  if (memoryKey) {
    const { data } = await supabase
      .from('kivo_memories')
      .select('id, user_id, type, content, importance, confidence, memory_key, created_at, updated_at')
      .eq('user_id', userId)
      .eq('memory_key', memoryKey)
      .eq('archived', false)
      .maybeSingle();

    if (data?.id) return data as KivoMemoryRow;
  }

  const { data } = await supabase
    .from('kivo_memories')
    .select('id, user_id, type, content, importance, confidence, memory_key, created_at, updated_at')
    .eq('user_id', userId)
    .eq('archived', false)
    .limit(MAX_EXISTING_MEMORY_SCAN);

  return ((data ?? []) as KivoMemoryRow[]).find((memory) => {
    return normalizeMemoryType(memory.type) === type && looksSimilar(content, memory.content ?? '');
  });
}

async function logMemoryEvent(options: {
  userId: string;
  memoryId?: string | null;
  eventType: 'created' | 'updated' | 'used' | 'archived' | 'merged' | 'superseded' | 'reviewed' | 'deleted';
  details?: JsonRecord;
}) {
  if (!options.userId) return;

  await createSupabaseServer().from('kivo_memory_events').insert({
    user_id: options.userId,
    memory_id: options.memoryId ?? null,
    event_type: options.eventType,
    details: options.details ?? {},
  });
}

async function queueMemoryConsolidation(options: {
  userId: string;
  candidateIds: string[];
  reason: string;
  priority?: number;
  metadata?: JsonRecord;
}) {
  const candidateIds = Array.from(new Set(options.candidateIds.filter(Boolean)));
  if (!options.userId || candidateIds.length < 2) return;

  await createSupabaseServer().from('kivo_memory_consolidation_queue').insert({
    user_id: options.userId,
    candidate_ids: candidateIds,
    reason: options.reason,
    priority: clampMemoryImportance(options.priority ?? 3),
    metadata: options.metadata ?? {},
    status: 'pending',
  });
}

async function tryGenerateEmbeddingForMemory(row: {
  user_id: string;
  id: string;
  title?: string | null;
  content: string;
  summary?: string | null;
  tags?: string[] | null;
  relevance_hint?: string | null;
}) {
  try {
    await generateAndStoreMemoryEmbedding({
      userId: row.user_id,
      memoryId: row.id,
      title: row.title,
      content: row.content,
      summary: row.summary,
      tags: row.tags,
      relevanceHint: row.relevance_hint,
    });
  } catch {
    // Embeddings are helpful but must never break chat or memory saving.
  }
}

export async function getMemoryContext(
  userId?: string,
  message?: string,
  options: GetMemoryContextOptions = {},
): Promise<AgentMemoryContext> {
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
  const query = compactMemoryText(message, 900);

  const queryEmbeddingResult = query ? await generateQueryEmbedding(query) : null;

  const [{ data: profile }, { data: goals }, { data: people }, { data: runs }, retrieval] = await Promise.all([
    supabase
      .from('kivo_profiles')
      .select('display_name, language, timezone')
      .eq('user_id', userId)
      .maybeSingle(),

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

    retrieveKivoMemories({
      userId,
      query,
      queryEmbedding: queryEmbeddingResult?.embedding ?? undefined,
      conversationId: options.conversationId,
      includeConversationContext: options.includeConversationContext ?? Boolean(options.conversationId),
      includeConversationSummary: options.includeConversationSummary ?? true,
      recentMessageLimit: options.recentMessageLimit ?? 16,
      finalLimit: options.finalMemoryLimit ?? 14,
    }),
  ]);

  const retrievedMemoryLines = retrieval.memories.map(formatMemoryForPrompt);
  const goalLines = buildGoalLines(goals as GoalRow[]);
  const peopleLines = buildPeopleLines(people as PersonRow[]);

  const preferences = [
    ...retrievedMemoryLines,
    ...goalLines,
    ...peopleLines,
  ].slice(0, MAX_PROFILE_LINES);

  const recentRuns = ((runs ?? []) as AgentRunRow[])
    .map(formatRecentRun)
    .filter(Boolean);

  const shortTermPrompt = formatMemoryRetrievalForPrompt(retrieval);
  const recentContext = [
    ...(shortTermPrompt && shortTermPrompt !== 'No relevant memory context found.' ? [shortTermPrompt] : []),
    ...retrieval.shortTerm.formattedRecentMessages,
    ...recentRuns,
  ]
    .filter(Boolean)
    .slice(0, 18);

  const memoryTexts = [
    ...retrieval.memories.map((memory) => `${memory.title ?? ''} ${memory.summary ?? ''} ${memory.content}`),
    ...goalLines,
    ...peopleLines,
  ];

  return {
    profileSummary: buildProfileSummary(profile as ProfileRow),
    preferences,
    recentContext,
    insights: buildInsights(memoryTexts),
    proactiveSuggestions: buildProactiveSuggestions(memoryTexts),
  };
}

export async function saveAgentRun(userId: string, message: string, answer: string, meta?: any) {
  if (!userId) return;

  const supabase = createSupabaseServer();

  await supabase.from('kivo_agent_runs').insert({
    user_id: userId,
    message: compactMemoryText(message, 4000),
    answer: compactMemoryText(answer, 8000),
    agent: meta?.agent ?? 'kivo',
    mode: meta?.mode ?? 'chat',
    context: meta?.context ?? 'general',
    model: meta?.model,
    provider: meta?.provider,
    steps: meta?.steps ?? [],
    structured_data: meta?.structuredData ?? {},
    status: meta?.status ?? 'done',
  });
}

export async function saveMemory(
  userIdOrInput: string | KivoSaveMemoryInput,
  content?: string,
  type?: any,
  importance = 3,
) {
  const input: KivoSaveMemoryInput =
    typeof userIdOrInput === 'string'
      ? {
          userId: userIdOrInput,
          content: content ?? '',
          type,
          importance,
          source: 'chat',
        }
      : userIdOrInput;

  if (!input.userId) return null;

  const clean = cleanMemoryInput(input);
  if (!clean.content) return null;
  if (isLikelyGenericWorldFact(clean.content, clean.type)) return null;

  const existing = await findExistingSimilarMemory(input.userId, clean.type, clean.content, clean.memoryKey);
  const supabase = createSupabaseServer();

  if (existing?.id) {
    const existingContent = toMemoryText(existing.content);
    const shouldReplaceContent = clean.content.length > existingContent.length;

    const updatePayload = {
      content: shouldReplaceContent ? clean.content : existingContent,
      title: clean.title,
      summary: clean.summary,
      type: clean.type,
      importance: Math.max(clampMemoryImportance(existing.importance), clean.importance),
      confidence: Math.max(clampMemoryConfidence(existing.confidence), clean.confidence),
      source: clean.source,
      memory_key: clean.memoryKey || existing.memory_key,
      memory_scope: clean.memoryScope,
      tags: clean.tags,
      entities: clean.entities,
      metadata: {
        ...safeMemoryMetadata((existing as any).metadata),
        ...clean.metadata,
      },
      visibility: clean.visibility,
      source_conversation_id: clean.sourceConversationId,
      source_message_id: clean.sourceMessageId,
      expires_at: clean.expiresAt,
      relevance_hint: clean.relevanceHint,
      archived: false,
      status: 'active',
      updated_at: nowIso(),
    };

    const { data, error } = await supabase
      .from('kivo_memories')
      .update(updatePayload)
      .eq('id', existing.id)
      .eq('user_id', input.userId)
      .select('id, user_id, title, content, summary, tags, relevance_hint')
      .maybeSingle();

    if (!error && data?.id) {
      await logMemoryEvent({
        userId: input.userId,
        memoryId: data.id,
        eventType: 'updated',
        details: {
          reason: 'similar_memory_upsert',
          memory_key: clean.memoryKey,
        },
      });

      await tryGenerateEmbeddingForMemory(data as any);
      return data;
    }

    return null;
  }

  const insertPayload = {
    user_id: input.userId,
    content: clean.content,
    title: clean.title,
    summary: clean.summary,
    type: clean.type,
    importance: clean.importance,
    confidence: clean.confidence,
    source: clean.source,
    archived: false,
    status: 'active',
    memory_key: clean.memoryKey || null,
    memory_scope: clean.memoryScope,
    tags: clean.tags,
    entities: clean.entities,
    metadata: clean.metadata,
    visibility: clean.visibility,
    source_conversation_id: clean.sourceConversationId,
    source_message_id: clean.sourceMessageId,
    expires_at: clean.expiresAt,
    relevance_hint: clean.relevanceHint,
    updated_at: nowIso(),
  };

  let { data, error } = await supabase
    .from('kivo_memories')
    .insert(insertPayload)
    .select('id, user_id, title, content, summary, tags, relevance_hint')
    .maybeSingle();

  if (error) {
    const fallbackType = dbFallbackType(clean.type);

    if (fallbackType !== clean.type) {
      const fallbackResult = await supabase
        .from('kivo_memories')
        .insert({
          ...insertPayload,
          type: fallbackType,
        })
        .select('id, user_id, title, content, summary, tags, relevance_hint')
        .maybeSingle();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }
  }

  if (error || !data?.id) return null;

  await logMemoryEvent({
    userId: input.userId,
    memoryId: data.id,
    eventType: 'created',
    details: {
      source: clean.source,
      memory_key: clean.memoryKey,
      memory_scope: clean.memoryScope,
    },
  });

  await tryGenerateEmbeddingForMemory(data as any);

  return data;
}

export async function archiveBadMemories(userId: string) {
  if (!userId) return;

  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_memories')
    .select('id, user_id, content, type, archived, status, expires_at')
    .eq('user_id', userId)
    .eq('archived', false)
    .limit(300);

  const badIds = ((data ?? []) as KivoMemoryRow[])
    .filter((memory) => {
      const contentText = memory.content ?? '';

      return (
        !isActiveMemory(memory) ||
        isLikelyGenericWorldFact(contentText, memory.type) ||
        isStaleIntegrationMemory(contentText)
      );
    })
    .map((memory) => memory.id);

  if (!badIds.length) return;

  await supabase
    .from('kivo_memories')
    .update({
      archived: true,
      status: 'archived',
      updated_at: nowIso(),
    })
    .in('id', badIds)
    .eq('user_id', userId);

  await Promise.allSettled(
    badIds.map((memoryId) =>
      logMemoryEvent({
        userId,
        memoryId,
        eventType: 'archived',
        details: {
          reason: 'archive_bad_memories',
        },
      }),
    ),
  );
}

export async function queueDuplicateMemoryReview(userId: string) {
  if (!userId) return;

  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_memories')
    .select('id, type, content, memory_key')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('updated_at', { ascending: false })
    .limit(300);

  const rows = (data ?? []) as KivoMemoryRow[];
  const groups = new Map<string, string[]>();

  for (const row of rows) {
    const key = row.memory_key || `${normalizeMemoryType(row.type)}:${normalizeMemoryText(row.content).slice(0, 80)}`;
    if (!key) continue;

    const existing = groups.get(key) ?? [];
    existing.push(row.id);
    groups.set(key, existing);
  }

  const duplicateGroups = Array.from(groups.values()).filter((ids) => ids.length > 1);

  await Promise.allSettled(
    duplicateGroups.map((ids) =>
      queueMemoryConsolidation({
        userId,
        candidateIds: ids,
        reason: 'duplicate_memory_key',
        priority: 4,
      }),
    ),
  );
}

export async function saveConversationSummary(input: KivoConversationSummaryInput) {
  if (!input.userId || !input.conversationId) return null;

  const supabase = createSupabaseServer();

  const { data, error } = await supabase.rpc('upsert_kivo_conversation_summary', {
    p_user_id: input.userId,
    p_conversation_id: input.conversationId,
    p_summary: compactMemoryText(input.summary, 4000),
    p_key_points: (input.keyPoints ?? []).map((item) => compactMemoryText(item, 320)).filter(Boolean),
    p_decisions: (input.decisions ?? []).map((item) => compactMemoryText(item, 320)).filter(Boolean),
    p_open_loops: (input.openLoops ?? []).map((item) => compactMemoryText(item, 320)).filter(Boolean),
    p_last_message_id: input.lastMessageId ?? null,
    p_message_count: Math.max(0, Math.round(Number(input.messageCount) || 0)),
    p_metadata: input.metadata ?? {},
  });

  if (error || !data) return null;

  try {
    await generateAndStoreConversationSummaryEmbedding(input);
  } catch {
    // Never fail chat because summary embedding failed.
  }

  return data;
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
      updated_at: nowIso(),
    },
    { onConflict: 'user_id' },
  );
}
