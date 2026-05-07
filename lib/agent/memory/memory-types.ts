export const KIVO_MEMORY_EMBEDDING_DIMENSIONS = 1536;

export const KIVO_MEMORY_TYPES = [
  'preference',
  'fact',
  'personal_fact',
  'project',
  'goal',
  'routine',
  'constraint',
  'integration_status',
] as const;

export const KIVO_MEMORY_SCOPES = [
  'long_term',
  'project',
  'tool',
  'conversation_summary',
] as const;

export const KIVO_MEMORY_STATUSES = [
  'active',
  'needs_review',
  'superseded',
  'archived',
] as const;

export const KIVO_MEMORY_VISIBILITIES = [
  'private',
  'system',
  'hidden',
] as const;

export const KIVO_MEMORY_EVENT_TYPES = [
  'created',
  'updated',
  'used',
  'archived',
  'merged',
  'superseded',
  'reviewed',
  'deleted',
] as const;

export const KIVO_CONSOLIDATION_STATUSES = [
  'pending',
  'processing',
  'done',
  'skipped',
  'failed',
] as const;

export type KivoMemoryType = (typeof KIVO_MEMORY_TYPES)[number];
export type KivoMemoryScope = (typeof KIVO_MEMORY_SCOPES)[number];
export type KivoMemoryStatus = (typeof KIVO_MEMORY_STATUSES)[number];
export type KivoMemoryVisibility = (typeof KIVO_MEMORY_VISIBILITIES)[number];
export type KivoMemoryEventType = (typeof KIVO_MEMORY_EVENT_TYPES)[number];
export type KivoMemoryConsolidationStatus = (typeof KIVO_CONSOLIDATION_STATUSES)[number];

export type KivoMemorySource =
  | 'chat'
  | 'user'
  | 'system'
  | 'gmail'
  | 'calendar'
  | 'outlook'
  | 'drive'
  | 'agent'
  | 'import'
  | 'cleanup'
  | string;

export type KivoMemoryVector = number[];

export type JsonRecord = Record<string, unknown>;

export type KivoMemoryRow = {
  id: string;
  user_id: string;

  type: KivoMemoryType | string;
  content: string;
  title?: string | null;
  summary?: string | null;

  importance: number;
  confidence?: number | null;

  source?: KivoMemorySource | null;
  archived?: boolean | null;

  memory_key?: string | null;
  memory_scope?: KivoMemoryScope | string | null;
  status?: KivoMemoryStatus | string | null;

  tags?: string[] | null;
  entities?: JsonRecord | null;
  metadata?: JsonRecord | null;
  visibility?: KivoMemoryVisibility | string | null;

  source_conversation_id?: string | null;
  source_message_id?: string | null;
  supersedes_memory_id?: string | null;

  expires_at?: string | null;
  last_used_at?: string | null;
  use_count?: number | null;

  embedding?: KivoMemoryVector | string | null;
  embedding_model?: string | null;
  embedding_updated_at?: string | null;
  relevance_hint?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type KivoConversationSummaryRow = {
  id: string;
  user_id: string;
  conversation_id: string;

  summary: string;
  key_points: string[];
  decisions: string[];
  open_loops: string[];

  last_message_id?: string | null;
  message_count: number;

  embedding?: KivoMemoryVector | string | null;
  embedding_model?: string | null;
  embedding_updated_at?: string | null;

  metadata?: JsonRecord | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type KivoConversationMessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: JsonRecord | null;
  created_at?: string | null;
};

export type KivoMemoryEventRow = {
  id: string;
  user_id: string;
  memory_id?: string | null;
  event_type: KivoMemoryEventType | string;
  details?: JsonRecord | null;
  created_at?: string | null;
};

export type KivoMemoryConsolidationQueueRow = {
  id: string;
  user_id: string;
  candidate_ids: string[];
  reason: string;
  status: KivoMemoryConsolidationStatus | string;
  priority: number;
  metadata?: JsonRecord | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type KivoMemoryCandidate = {
  type: KivoMemoryType;
  content: string;
  title?: string;
  summary?: string;
  importance: 1 | 2 | 3 | 4 | 5;
  confidence?: number;
  tags?: string[];
  entities?: JsonRecord;
  memoryScope?: KivoMemoryScope;
  source?: KivoMemorySource;
  relevanceHint?: string;
  metadata?: JsonRecord;
};

export type KivoSaveMemoryInput = {
  userId: string;
  content: string;
  type?: KivoMemoryType | string;
  title?: string;
  summary?: string;
  importance?: number;
  confidence?: number;
  source?: KivoMemorySource;
  memoryKey?: string;
  memoryScope?: KivoMemoryScope;
  tags?: string[];
  entities?: JsonRecord;
  metadata?: JsonRecord;
  visibility?: KivoMemoryVisibility;
  sourceConversationId?: string;
  sourceMessageId?: string;
  expiresAt?: string | null;
  relevanceHint?: string;
  embedding?: KivoMemoryVector;
  embeddingModel?: string;
};

export type KivoRetrievedMemory = {
  id: string;
  type: KivoMemoryType;
  content: string;
  title?: string;
  summary?: string;
  importance: number;
  confidence: number;
  tags: string[];
  memoryScope: KivoMemoryScope;
  source?: KivoMemorySource;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
  similarity?: number;
  rank?: number;
  score: number;
  reason?: string;
};

export type KivoMemoryRetrievalOptions = {
  userId: string;
  query?: string;
  queryEmbedding?: KivoMemoryVector;
  conversationId?: string;

  semanticThreshold?: number;
  semanticLimit?: number;
  keywordLimit?: number;
  finalLimit?: number;

  includeArchived?: boolean;
  includeConversationContext?: boolean;
  includeConversationSummary?: boolean;
  recentMessageLimit?: number;
};

export type KivoShortTermConversationContext = {
  conversationId?: string;
  summary?: KivoConversationSummaryRow | null;
  recentMessages: KivoConversationMessageRow[];
  formattedRecentMessages: string[];
};

export type KivoMemoryRetrievalResult = {
  memories: KivoRetrievedMemory[];
  shortTerm: KivoShortTermConversationContext;
  usedMemoryIds: string[];
  debug?: {
    semanticCount?: number;
    keywordCount?: number;
    recentMessageCount?: number;
    summaryUsed?: boolean;
  };
};

export type KivoMemoryContextV3 = {
  profileSummary: string;

  longTermMemories: KivoRetrievedMemory[];
  recentMessages: string[];
  conversationSummary?: string;

  preferences: string[];
  recentContext: string[];

  insights: string[];
  proactiveSuggestions: string[];

  activeProjects?: string[];
  goals?: string[];
  routines?: string[];
  constraints?: string[];
  integrations?: string[];

  raw?: {
    memories: KivoRetrievedMemory[];
    shortTerm: KivoShortTermConversationContext;
  };
};

export type KivoConversationSummaryInput = {
  userId: string;
  conversationId: string;
  summary: string;
  keyPoints?: string[];
  decisions?: string[];
  openLoops?: string[];
  lastMessageId?: string | null;
  messageCount?: number;
  metadata?: JsonRecord;
  embedding?: KivoMemoryVector;
  embeddingModel?: string;
};

export type KivoMemoryEmbeddingInput = {
  id: string;
  content: string;
  title?: string | null;
  summary?: string | null;
  tags?: string[] | null;
  relevanceHint?: string | null;
};

export type KivoMemoryCleanupResult = {
  archivedIds: string[];
  reviewIds: string[];
  consolidationQueueIds: string[];
};

export function toMemoryText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function compactMemoryText(value: unknown, max = 700) {
  return toMemoryText(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function normalizeMemoryText(value: unknown) {
  return toMemoryText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/@.:_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function uniqueMemoryWords(text: string) {
  return Array.from(
    new Set(
      normalizeMemoryText(text)
        .split(' ')
        .filter((word) => word.length > 2),
    ),
  );
}

export function isKivoMemoryType(value: unknown): value is KivoMemoryType {
  return KIVO_MEMORY_TYPES.includes(value as KivoMemoryType);
}

export function isKivoMemoryScope(value: unknown): value is KivoMemoryScope {
  return KIVO_MEMORY_SCOPES.includes(value as KivoMemoryScope);
}

export function isKivoMemoryStatus(value: unknown): value is KivoMemoryStatus {
  return KIVO_MEMORY_STATUSES.includes(value as KivoMemoryStatus);
}

export function isKivoMemoryVisibility(value: unknown): value is KivoMemoryVisibility {
  return KIVO_MEMORY_VISIBILITIES.includes(value as KivoMemoryVisibility);
}

export function normalizeMemoryType(value: unknown): KivoMemoryType {
  const raw = toMemoryText(value).toLowerCase();
  return isKivoMemoryType(raw) ? raw : 'fact';
}

export function normalizeMemoryScope(value: unknown): KivoMemoryScope {
  const raw = toMemoryText(value).toLowerCase();
  return isKivoMemoryScope(raw) ? raw : 'long_term';
}

export function normalizeMemoryStatus(value: unknown): KivoMemoryStatus {
  const raw = toMemoryText(value).toLowerCase();
  return isKivoMemoryStatus(raw) ? raw : 'active';
}

export function normalizeMemoryVisibility(value: unknown): KivoMemoryVisibility {
  const raw = toMemoryText(value).toLowerCase();
  return isKivoMemoryVisibility(raw) ? raw : 'private';
}

export function clampMemoryImportance(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const number = Math.round(Number(value) || 3);

  if (number <= 1) return 1;
  if (number === 2) return 2;
  if (number === 4) return 4;
  if (number >= 5) return 5;

  return 3;
}

export function clampMemoryConfidence(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0.8;

  return Math.max(0, Math.min(1, number));
}

export function normalizeMemoryTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => normalizeMemoryText(item))
        .filter((item) => item.length > 1)
        .slice(0, 16),
    ),
  );
}

export function safeMemoryMetadata(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as JsonRecord;
}

export function buildMemoryKey(input: {
  userId?: string;
  type?: unknown;
  content?: unknown;
  title?: unknown;
}) {
  const type = normalizeMemoryType(input.type);
  const base = normalizeMemoryText(input.title || input.content)
    .split(' ')
    .filter(Boolean)
    .slice(0, 10)
    .join('-');

  if (!base) return '';

  return `${type}:${base}`.slice(0, 120);
}

export function memoryRowToRetrievedMemory(
  row: KivoMemoryRow,
  options?: {
    similarity?: number;
    rank?: number;
    score?: number;
    reason?: string;
  },
): KivoRetrievedMemory {
  const importance = clampMemoryImportance(row.importance);
  const confidence = clampMemoryConfidence(row.confidence);
  const similarity = options?.similarity;
  const rank = options?.rank;

  const baseScore =
    options?.score ??
    importance * 14 +
      confidence * 20 +
      (typeof similarity === 'number' ? similarity * 35 : 0) +
      (typeof rank === 'number' ? rank * 15 : 0);

  return {
    id: row.id,
    type: normalizeMemoryType(row.type),
    content: compactMemoryText(row.content, 900),
    title: compactMemoryText(row.title, 160) || undefined,
    summary: compactMemoryText(row.summary, 360) || undefined,
    importance,
    confidence,
    tags: normalizeMemoryTags(row.tags),
    memoryScope: normalizeMemoryScope(row.memory_scope),
    source: row.source ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    similarity,
    rank,
    score: Math.round(baseScore * 100) / 100,
    reason: options?.reason,
  };
}

export function formatMemoryForPrompt(memory: KivoRetrievedMemory) {
  const label = memory.title || memory.summary || memory.content;
  const tags = memory.tags.length ? ` tags: ${memory.tags.join(', ')}` : '';
  const confidence = Number.isFinite(memory.confidence)
    ? ` confidence: ${Math.round(memory.confidence * 100)}%`
    : '';

  return `[${memory.type}] ${label}${tags}${confidence}`;
}

export function formatConversationMessageForPrompt(message: KivoConversationMessageRow) {
  const role = message.role === 'assistant' ? 'Kivo' : 'User';
  return `${role}: ${compactMemoryText(message.content, 500)}`;
}

export function shouldExpireMemory(memory: Pick<KivoMemoryRow, 'expires_at'>) {
  if (!memory.expires_at) return false;

  const timestamp = new Date(memory.expires_at).getTime();

  if (!Number.isFinite(timestamp)) return false;

  return timestamp <= Date.now();
}

export function isActiveMemory(memory: Pick<KivoMemoryRow, 'archived' | 'status' | 'expires_at'>) {
  if (memory.archived) return false;
  if (normalizeMemoryStatus(memory.status) === 'archived') return false;
  if (normalizeMemoryStatus(memory.status) === 'superseded') return false;
  if (shouldExpireMemory(memory)) return false;

  return true;
}
