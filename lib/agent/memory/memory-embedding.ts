import { createSupabaseServer } from '@/lib/supabase/server';
import {
  KIVO_MEMORY_EMBEDDING_DIMENSIONS,
  type KivoConversationSummaryInput,
  type KivoMemoryEmbeddingInput,
  type KivoMemoryRow,
  type KivoMemoryVector,
  compactMemoryText,
  normalizeMemoryText,
  toMemoryText,
} from './memory-types';

export type KivoEmbeddingProvider = 'openai' | 'disabled' | 'unavailable';

export type KivoEmbeddingResult = {
  embedding: KivoMemoryVector | null;
  model: string | null;
  provider: KivoEmbeddingProvider;
  dimensions: number;
  skipped: boolean;
  reason?: string;
  error?: string;
};

export type KivoEmbeddingStoreResult = {
  success: boolean;
  id?: string;
  model?: string | null;
  provider?: KivoEmbeddingProvider;
  dimensions?: number;
  skipped?: boolean;
  error?: string;
};

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_EMBEDDING_TEXT_LENGTH = 7000;
const MIN_EMBEDDING_TEXT_LENGTH = 8;

function getEmbeddingModel() {
  return process.env.KIVO_EMBEDDING_MODEL || process.env.OPENAI_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
}

function embeddingsDisabled() {
  return process.env.KIVO_DISABLE_EMBEDDINGS === 'true';
}

function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || process.env.KIVO_OPENAI_API_KEY || '';
}

function normalizeVector(vector: unknown): KivoMemoryVector | null {
  if (!Array.isArray(vector)) return null;

  const clean = vector.map(Number).filter((value) => Number.isFinite(value));

  if (clean.length !== KIVO_MEMORY_EMBEDDING_DIMENSIONS) return null;

  return clean;
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message : 'Embedding generation failed.';
}

function buildEmbeddingText(parts: Array<string | null | undefined>) {
  return compactMemoryText(
    parts
      .map((part) => toMemoryText(part))
      .filter(Boolean)
      .join('\n\n'),
    MAX_EMBEDDING_TEXT_LENGTH,
  );
}

export function buildMemoryEmbeddingInput(input: KivoMemoryEmbeddingInput) {
  return buildEmbeddingText([
    input.title ? `Title: ${input.title}` : '',
    input.summary ? `Summary: ${input.summary}` : '',
    input.content ? `Content: ${input.content}` : '',
    input.tags?.length ? `Tags: ${input.tags.join(', ')}` : '',
    input.relevanceHint ? `Relevance: ${input.relevanceHint}` : '',
  ]);
}

export function buildConversationSummaryEmbeddingInput(input: Pick<KivoConversationSummaryInput, 'summary' | 'keyPoints' | 'decisions' | 'openLoops'>) {
  return buildEmbeddingText([
    input.summary ? `Conversation summary: ${input.summary}` : '',
    input.keyPoints?.length ? `Key points:\n${input.keyPoints.join('\n')}` : '',
    input.decisions?.length ? `Decisions:\n${input.decisions.join('\n')}` : '',
    input.openLoops?.length ? `Open loops:\n${input.openLoops.join('\n')}` : '',
  ]);
}

export function shouldGenerateEmbedding(text: unknown) {
  const clean = normalizeMemoryText(text);

  if (embeddingsDisabled()) return false;
  if (clean.length < MIN_EMBEDDING_TEXT_LENGTH) return false;
  if (!getOpenAIKey()) return false;

  return true;
}

export async function generateMemoryEmbedding(text: string): Promise<KivoEmbeddingResult> {
  const clean = compactMemoryText(text, MAX_EMBEDDING_TEXT_LENGTH);
  const model = getEmbeddingModel();

  if (embeddingsDisabled()) {
    return {
      embedding: null,
      model,
      provider: 'disabled',
      dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
      skipped: true,
      reason: 'Embeddings are disabled.',
    };
  }

  if (normalizeMemoryText(clean).length < MIN_EMBEDDING_TEXT_LENGTH) {
    return {
      embedding: null,
      model,
      provider: 'unavailable',
      dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
      skipped: true,
      reason: 'Text is too short for embedding.',
    };
  }

  const apiKey = getOpenAIKey();

  if (!apiKey) {
    return {
      embedding: null,
      model,
      provider: 'unavailable',
      dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
      skipped: true,
      reason: 'OPENAI_API_KEY is missing.',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: clean,
        dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        embedding: null,
        model,
        provider: 'openai',
        dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
        skipped: false,
        error: data?.error?.message || `OpenAI embeddings request failed (${response.status}).`,
      };
    }

    const embedding = normalizeVector(data?.data?.[0]?.embedding);

    if (!embedding) {
      return {
        embedding: null,
        model,
        provider: 'openai',
        dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
        skipped: false,
        error: 'Embedding response had invalid dimensions.',
      };
    }

    return {
      embedding,
      model,
      provider: 'openai',
      dimensions: embedding.length,
      skipped: false,
    };
  } catch (error) {
    return {
      embedding: null,
      model,
      provider: 'openai',
      dimensions: KIVO_MEMORY_EMBEDDING_DIMENSIONS,
      skipped: false,
      error: safeError(error),
    };
  }
}

export async function generateQueryEmbedding(query: string): Promise<KivoEmbeddingResult> {
  return generateMemoryEmbedding(query);
}

export async function generateMemoryInputEmbedding(input: KivoMemoryEmbeddingInput): Promise<KivoEmbeddingResult> {
  return generateMemoryEmbedding(buildMemoryEmbeddingInput(input));
}

export async function storeMemoryEmbedding(options: {
  userId: string;
  memoryId: string;
  embedding: KivoMemoryVector;
  model?: string | null;
}): Promise<KivoEmbeddingStoreResult> {
  if (!options.userId || !options.memoryId) {
    return {
      success: false,
      error: 'Missing userId or memoryId.',
    };
  }

  const embedding = normalizeVector(options.embedding);

  if (!embedding) {
    return {
      success: false,
      error: 'Invalid memory embedding.',
    };
  }

  const supabase = createSupabaseServer();

  const { error } = await supabase
    .from('kivo_memories')
    .update({
      embedding,
      embedding_model: options.model || getEmbeddingModel(),
      embedding_updated_at: new Date().toISOString(),
    })
    .eq('id', options.memoryId)
    .eq('user_id', options.userId);

  if (error) {
    return {
      success: false,
      id: options.memoryId,
      error: error.message,
    };
  }

  return {
    success: true,
    id: options.memoryId,
    model: options.model || getEmbeddingModel(),
    provider: 'openai',
    dimensions: embedding.length,
  };
}

export async function generateAndStoreMemoryEmbedding(options: {
  userId: string;
  memoryId: string;
  title?: string | null;
  content: string;
  summary?: string | null;
  tags?: string[] | null;
  relevanceHint?: string | null;
}): Promise<KivoEmbeddingStoreResult> {
  const text = buildMemoryEmbeddingInput({
    id: options.memoryId,
    title: options.title,
    content: options.content,
    summary: options.summary,
    tags: options.tags,
    relevanceHint: options.relevanceHint,
  });

  const result = await generateMemoryEmbedding(text);

  if (!result.embedding) {
    return {
      success: false,
      id: options.memoryId,
      model: result.model,
      provider: result.provider,
      dimensions: result.dimensions,
      skipped: result.skipped,
      error: result.error || result.reason || 'Embedding was not generated.',
    };
  }

  return storeMemoryEmbedding({
    userId: options.userId,
    memoryId: options.memoryId,
    embedding: result.embedding,
    model: result.model,
  });
}

export async function generateAndStoreMemoryRowEmbedding(row: KivoMemoryRow): Promise<KivoEmbeddingStoreResult> {
  return generateAndStoreMemoryEmbedding({
    userId: row.user_id,
    memoryId: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    tags: row.tags,
    relevanceHint: row.relevance_hint,
  });
}

export async function storeConversationSummaryEmbedding(options: {
  userId: string;
  conversationId: string;
  embedding: KivoMemoryVector;
  model?: string | null;
}): Promise<KivoEmbeddingStoreResult> {
  if (!options.userId || !options.conversationId) {
    return {
      success: false,
      error: 'Missing userId or conversationId.',
    };
  }

  const embedding = normalizeVector(options.embedding);

  if (!embedding) {
    return {
      success: false,
      error: 'Invalid conversation summary embedding.',
    };
  }

  const supabase = createSupabaseServer();

  const { error } = await supabase
    .from('kivo_conversation_summaries')
    .update({
      embedding,
      embedding_model: options.model || getEmbeddingModel(),
      embedding_updated_at: new Date().toISOString(),
    })
    .eq('user_id', options.userId)
    .eq('conversation_id', options.conversationId);

  if (error) {
    return {
      success: false,
      id: options.conversationId,
      error: error.message,
    };
  }

  return {
    success: true,
    id: options.conversationId,
    model: options.model || getEmbeddingModel(),
    provider: 'openai',
    dimensions: embedding.length,
  };
}

export async function generateAndStoreConversationSummaryEmbedding(input: KivoConversationSummaryInput): Promise<KivoEmbeddingStoreResult> {
  const text = buildConversationSummaryEmbeddingInput(input);
  const result = await generateMemoryEmbedding(text);

  if (!result.embedding) {
    return {
      success: false,
      id: input.conversationId,
      model: result.model,
      provider: result.provider,
      dimensions: result.dimensions,
      skipped: result.skipped,
      error: result.error || result.reason || 'Conversation embedding was not generated.',
    };
  }

  return storeConversationSummaryEmbedding({
    userId: input.userId,
    conversationId: input.conversationId,
    embedding: result.embedding,
    model: result.model,
  });
}

export async function backfillMissingMemoryEmbeddings(options: {
  userId: string;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(Math.round(Number(options.limit) || 20), 50));
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from('kivo_memories')
    .select('id, user_id, type, title, content, summary, importance, confidence, tags, memory_scope, source, archived, status, expires_at, relevance_hint, created_at, updated_at, last_used_at')
    .eq('user_id', options.userId)
    .eq('archived', false)
    .is('embedding', null)
    .in('status', ['active', 'needs_review'])
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: error ? [error.message] : [],
    };
  }

  const results = [];

  for (const row of data as KivoMemoryRow[]) {
    results.push(await generateAndStoreMemoryRowEmbedding(row));
  }

  return {
    processed: results.length,
    succeeded: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success && !result.skipped).length,
    skipped: results.filter((result) => result.skipped).length,
    errors: results.map((result) => result.error).filter(Boolean),
  };
}

export function embeddingResultForDebug(result: KivoEmbeddingResult) {
  return {
    provider: result.provider,
    model: result.model,
    dimensions: result.dimensions,
    hasEmbedding: Boolean(result.embedding),
    skipped: result.skipped,
    reason: result.reason,
    error: result.error,
  };
}
