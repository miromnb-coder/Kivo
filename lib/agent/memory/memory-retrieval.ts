import { createSupabaseServer } from '@/lib/supabase/server';
import {
  type KivoConversationMessageRow,
  type KivoConversationSummaryRow,
  type KivoMemoryRetrievalOptions,
  type KivoMemoryRetrievalResult,
  type KivoMemoryRow,
  type KivoRetrievedMemory,
  type KivoShortTermConversationContext,
  compactMemoryText,
  formatConversationMessageForPrompt,
  formatMemoryForPrompt,
  isActiveMemory,
  memoryRowToRetrievedMemory,
  normalizeMemoryText,
  uniqueMemoryWords,
} from './memory-types';

const DEFAULT_SEMANTIC_THRESHOLD = 0.72;
const DEFAULT_SEMANTIC_LIMIT = 18;
const DEFAULT_KEYWORD_LIMIT = 18;
const DEFAULT_FINAL_LIMIT = 14;
const DEFAULT_RECENT_MESSAGE_LIMIT = 16;

type SupabaseClient = ReturnType<typeof createSupabaseServer>;

type RpcMemoryRow = KivoMemoryRow & {
  similarity?: number | null;
  rank?: number | null;
};

type RetrievedMemoryCandidate = KivoRetrievedMemory & {
  retrievalSource: 'semantic' | 'keyword' | 'fallback';
};

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampLimit(value: unknown, fallback: number, max = 50) {
  const number = Math.round(Number(value));

  if (!Number.isFinite(number) || number <= 0) return fallback;

  return Math.max(1, Math.min(number, max));
}

function embeddingToVectorLiteral(embedding?: number[]) {
  if (!Array.isArray(embedding) || embedding.length === 0) return null;

  const clean = embedding
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!clean.length) return null;

  return `[${clean.join(',')}]`;
}

function normalizeConversationId(value: unknown) {
  const text = toText(value);
  return text || undefined;
}

function recencyBoost(date?: string) {
  if (!date) return 0;

  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return 0;

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

  if (ageDays < 2) return 10;
  if (ageDays < 7) return 7;
  if (ageDays < 30) return 4;
  if (ageDays < 90) return 2;

  return 0;
}

function typeBoost(memory: KivoRetrievedMemory) {
  switch (memory.type) {
    case 'preference':
      return 14;

    case 'project':
      return 13;

    case 'goal':
      return 12;

    case 'constraint':
      return 11;

    case 'integration_status':
      return 9;

    case 'routine':
      return 8;

    case 'personal_fact':
      return 7;

    case 'fact':
    default:
      return 2;
  }
}

function scopeBoost(memory: KivoRetrievedMemory) {
  switch (memory.memoryScope) {
    case 'project':
      return 8;

    case 'tool':
      return 6;

    case 'conversation_summary':
      return 5;

    case 'long_term':
    default:
      return 3;
  }
}

function keywordOverlapScore(query: string, memory: KivoRetrievedMemory) {
  const queryWords = uniqueMemoryWords(query);
  if (!queryWords.length) return 0;

  const memoryText = normalizeMemoryText(
    [
      memory.title,
      memory.summary,
      memory.content,
      memory.tags.join(' '),
      memory.source,
      memory.memoryScope,
      memory.type,
    ]
      .filter(Boolean)
      .join(' '),
  );

  if (!memoryText) return 0;

  let score = 0;

  for (const word of queryWords) {
    if (memoryText.includes(word)) score += 4;
  }

  return Math.min(score, 24);
}

function calculateFinalScore(memory: KivoRetrievedMemory, query: string) {
  let score = 0;

  score += memory.importance * 14;
  score += memory.confidence * 18;
  score += typeBoost(memory);
  score += scopeBoost(memory);
  score += recencyBoost(memory.updatedAt);
  score += keywordOverlapScore(query, memory);

  if (typeof memory.similarity === 'number') {
    score += memory.similarity * 40;
  }

  if (typeof memory.rank === 'number') {
    score += memory.rank * 22;
  }

  if (memory.lastUsedAt) {
    score += 2;
  }

  return Math.round(score * 100) / 100;
}

function dedupeMemories(memories: RetrievedMemoryCandidate[]) {
  const byId = new Map<string, RetrievedMemoryCandidate>();

  for (const memory of memories) {
    const existing = byId.get(memory.id);

    if (!existing || memory.score > existing.score) {
      byId.set(memory.id, memory);
    }
  }

  return Array.from(byId.values());
}

function sortMemories(memories: RetrievedMemoryCandidate[]) {
  return memories.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
  });
}

function rpcRowToMemory(
  row: RpcMemoryRow,
  query: string,
  retrievalSource: RetrievedMemoryCandidate['retrievalSource'],
): RetrievedMemoryCandidate {
  const memory = memoryRowToRetrievedMemory(row, {
    similarity: typeof row.similarity === 'number' ? row.similarity : undefined,
    rank: typeof row.rank === 'number' ? row.rank : undefined,
    reason: retrievalSource,
  });

  return {
    ...memory,
    score: calculateFinalScore(memory, query),
    retrievalSource,
  };
}

async function retrieveSemanticMemories(
  supabase: SupabaseClient,
  options: KivoMemoryRetrievalOptions,
) {
  const vectorLiteral = embeddingToVectorLiteral(options.queryEmbedding);
  if (!vectorLiteral) return [];

  const { data, error } = await supabase.rpc('match_kivo_memories', {
    p_user_id: options.userId,
    query_embedding: vectorLiteral,
    match_threshold: options.semanticThreshold ?? DEFAULT_SEMANTIC_THRESHOLD,
    match_count: clampLimit(options.semanticLimit, DEFAULT_SEMANTIC_LIMIT),
    include_archived: Boolean(options.includeArchived),
  });

  if (error || !Array.isArray(data)) return [];

  return (data as unknown as RpcMemoryRow[])
    .filter((row) => row?.id && row?.content)
    .map((row) => rpcRowToMemory(row, options.query ?? '', 'semantic'));
}

async function retrieveKeywordMemories(
  supabase: SupabaseClient,
  options: KivoMemoryRetrievalOptions,
) {
  const query = compactMemoryText(options.query, 600);
  if (!query) return [];

  const { data, error } = await supabase.rpc('search_kivo_memories', {
    p_user_id: options.userId,
    p_query: query,
    match_count: clampLimit(options.keywordLimit, DEFAULT_KEYWORD_LIMIT),
    include_archived: Boolean(options.includeArchived),
  });

  if (error || !Array.isArray(data)) return [];

  return (data as unknown as RpcMemoryRow[])
    .filter((row) => row?.id && row?.content)
    .map((row) => rpcRowToMemory(row, query, 'keyword'));
}

async function retrieveFallbackMemories(
  supabase: SupabaseClient,
  options: KivoMemoryRetrievalOptions,
) {
  const { data, error } = await supabase
    .from('kivo_memories')
    .select(
      [
        'id',
        'user_id',
        'type',
        'title',
        'content',
        'summary',
        'importance',
        'confidence',
        'tags',
        'memory_scope',
        'source',
        'archived',
        'status',
        'expires_at',
        'created_at',
        'updated_at',
        'last_used_at',
      ].join(', '),
    )
    .eq('user_id', options.userId)
    .eq('archived', Boolean(options.includeArchived) ? true : false)
    .in('status', ['active', 'needs_review'])
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(clampLimit(options.finalLimit, DEFAULT_FINAL_LIMIT));

  if (error || !Array.isArray(data)) return [];

  return (data as unknown as KivoMemoryRow[])
    .filter((row) => row?.id && row?.content && isActiveMemory(row))
    .map((row) => {
      const memory = memoryRowToRetrievedMemory(row, {
        reason: 'fallback',
      });

      return {
        ...memory,
        score: calculateFinalScore(memory, options.query ?? ''),
        retrievalSource: 'fallback' as const,
      };
    });
}

async function getConversationSummary(
  supabase: SupabaseClient,
  userId: string,
  conversationId?: string,
): Promise<KivoConversationSummaryRow | null> {
  if (!conversationId) return null;

  const { data, error } = await supabase
    .from('kivo_conversation_summaries')
    .select(
      [
        'id',
        'user_id',
        'conversation_id',
        'summary',
        'key_points',
        'decisions',
        'open_loops',
        'last_message_id',
        'message_count',
        'metadata',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error || !data) return null;

  return data as unknown as KivoConversationSummaryRow;
}

async function getRecentConversationMessages(
  supabase: SupabaseClient,
  userId: string,
  conversationId?: string,
  limit = DEFAULT_RECENT_MESSAGE_LIMIT,
): Promise<KivoConversationMessageRow[]> {
  if (!conversationId) return [];

  const { data, error } = await supabase.rpc('get_kivo_recent_messages', {
    p_user_id: userId,
    p_conversation_id: conversationId,
    p_limit: clampLimit(limit, DEFAULT_RECENT_MESSAGE_LIMIT),
  });

  if (error || !Array.isArray(data)) return [];

  return (data as unknown as KivoConversationMessageRow[])
    .filter((message) => message?.id && message?.content)
    .map((message) => ({
      ...message,
      content: compactMemoryText(message.content, 1200),
    }));
}

async function getShortTermContext(
  supabase: SupabaseClient,
  options: KivoMemoryRetrievalOptions,
): Promise<KivoShortTermConversationContext> {
  const conversationId = normalizeConversationId(options.conversationId);

  if (!options.includeConversationContext || !conversationId) {
    return {
      conversationId,
      summary: null,
      recentMessages: [],
      formattedRecentMessages: [],
    };
  }

  const [summary, recentMessages] = await Promise.all([
    options.includeConversationSummary === false
      ? Promise.resolve(null)
      : getConversationSummary(supabase, options.userId, conversationId),

    getRecentConversationMessages(
      supabase,
      options.userId,
      conversationId,
      options.recentMessageLimit ?? DEFAULT_RECENT_MESSAGE_LIMIT,
    ),
  ]);

  return {
    conversationId,
    summary,
    recentMessages,
    formattedRecentMessages: recentMessages.map(formatConversationMessageForPrompt),
  };
}

async function touchRetrievedMemories(
  supabase: SupabaseClient,
  userId: string,
  memoryIds: string[],
) {
  if (!memoryIds.length) return;

  await supabase.rpc('touch_kivo_memories', {
    p_user_id: userId,
    p_memory_ids: Array.from(new Set(memoryIds)),
  });
}

export async function retrieveKivoMemories(
  options: KivoMemoryRetrievalOptions,
): Promise<KivoMemoryRetrievalResult> {
  if (!options.userId) {
    return {
      memories: [],
      shortTerm: {
        conversationId: options.conversationId,
        summary: null,
        recentMessages: [],
        formattedRecentMessages: [],
      },
      usedMemoryIds: [],
      debug: {
        semanticCount: 0,
        keywordCount: 0,
        recentMessageCount: 0,
        summaryUsed: false,
      },
    };
  }

  const supabase = createSupabaseServer();
  const query = compactMemoryText(options.query, 700);
  const finalLimit = clampLimit(options.finalLimit, DEFAULT_FINAL_LIMIT);

  const [semanticMemories, keywordMemories, shortTerm] = await Promise.all([
    retrieveSemanticMemories(supabase, options),
    retrieveKeywordMemories(supabase, options),
    getShortTermContext(supabase, options),
  ]);

  let candidates = sortMemories(dedupeMemories([...semanticMemories, ...keywordMemories]));

  if (!candidates.length) {
    candidates = await retrieveFallbackMemories(supabase, options);
  }

  const memories = candidates
    .map((memory) => ({
      ...memory,
      score: calculateFinalScore(memory, query),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, finalLimit);

  const usedMemoryIds = memories.map((memory) => memory.id);

  await touchRetrievedMemories(supabase, options.userId, usedMemoryIds);

  return {
    memories,
    shortTerm,
    usedMemoryIds,
    debug: {
      semanticCount: semanticMemories.length,
      keywordCount: keywordMemories.length,
      recentMessageCount: shortTerm.recentMessages.length,
      summaryUsed: Boolean(shortTerm.summary?.summary),
    },
  };
}

export function formatShortTermContextForPrompt(shortTerm: KivoShortTermConversationContext) {
  const lines: string[] = [];

  if (shortTerm.summary?.summary) {
    lines.push('Conversation summary:');
    lines.push(compactMemoryText(shortTerm.summary.summary, 900));
  }

  if (shortTerm.summary?.key_points?.length) {
    lines.push('Conversation key points:');
    for (const point of shortTerm.summary.key_points.slice(0, 6)) {
      lines.push(`- ${compactMemoryText(point, 220)}`);
    }
  }

  if (shortTerm.summary?.decisions?.length) {
    lines.push('Conversation decisions:');
    for (const decision of shortTerm.summary.decisions.slice(0, 5)) {
      lines.push(`- ${compactMemoryText(decision, 220)}`);
    }
  }

  if (shortTerm.summary?.open_loops?.length) {
    lines.push('Open loops:');
    for (const item of shortTerm.summary.open_loops.slice(0, 5)) {
      lines.push(`- ${compactMemoryText(item, 220)}`);
    }
  }

  if (shortTerm.formattedRecentMessages.length) {
    lines.push('Recent conversation messages:');
    for (const message of shortTerm.formattedRecentMessages.slice(-16)) {
      lines.push(`- ${message}`);
    }
  }

  return lines.join('\n');
}

export function formatRetrievedMemoriesForPrompt(memories: KivoRetrievedMemory[]) {
  if (!memories.length) return '';

  return [
    'Relevant long-term memories:',
    ...memories.map((memory) => `- ${formatMemoryForPrompt(memory)}`),
  ].join('\n');
}

export function formatMemoryRetrievalForPrompt(result: KivoMemoryRetrievalResult) {
  const sections = [
    formatShortTermContextForPrompt(result.shortTerm),
    formatRetrievedMemoriesForPrompt(result.memories),
  ].filter(Boolean);

  if (!sections.length) {
    return 'No relevant memory context found.';
  }

  return [
    'Memory context:',
    'Use this only when relevant. Do not invent personal facts.',
    ...sections,
  ].join('\n\n');
}

export function getMemoryDebugSummary(result: KivoMemoryRetrievalResult) {
  return {
    memories: result.memories.length,
    usedMemoryIds: result.usedMemoryIds.length,
    recentMessages: result.shortTerm.recentMessages.length,
    hasConversationSummary: Boolean(result.shortTerm.summary?.summary),
    semanticCount: result.debug?.semanticCount ?? 0,
    keywordCount: result.debug?.keywordCount ?? 0,
  };
}
