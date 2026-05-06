export type KivoAgentId = 'kivo' | 'planner' | 'researcher' | 'finance' | 'personal';
export type KivoModeId = 'chat' | 'ask' | 'deep';
export type KivoContextId = 'general' | 'work' | 'finance';
export type KivoComplexity = 'low' | 'medium' | 'high';

export type KivoModelId =
  | 'groq:fast'
  | 'groq:smart'
  | 'groq:search'
  | 'groq:deep-search'
  | 'groq:vision'
  | 'groq:compound'
  | 'openai:gpt-5.4-mini';

export type KivoModelMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type KivoWebSearchSettings = {
  country?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
};

export type KivoModelImage = {
  url?: string;
  base64?: string;
  mimeType?: string;
};

export type KivoWebSource = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

export type KivoModelInput = {
  agent?: KivoAgentId;
  mode?: KivoModeId;
  context?: KivoContextId;
  complexity?: KivoComplexity;
  messages: KivoModelMessage[];
  temperature?: number;
  maxTokens?: number;
  forceModel?: KivoModelId;
  webSearch?: KivoWebSearchSettings;
  images?: KivoModelImage[];
};

export type KivoModelResult = {
  model: KivoModelId;
  provider: 'groq' | 'openai';
  content: string;
  sources?: KivoWebSource[];
  raw?: unknown;
};

export const KIVO_MODEL_NAMES: Record<KivoModelId, string> = {
  // Fast everyday chat / routing / small JSON tasks.
  'groq:fast': 'openai/gpt-oss-20b',

  // Premium reasoning brain for agent planning, coding, memory, and tool reasoning.
  'groq:smart': 'openai/gpt-oss-120b',

  // Fast web-enabled Groq Compound system.
  'groq:search': 'groq/compound-mini',

  // Deeper multi-tool research Groq Compound system.
  'groq:deep-search': 'groq/compound',

  // Screenshot / image understanding.
  'groq:vision': 'meta-llama/llama-4-scout-17b-16e-instruct',

  // Backwards-compatible alias used by older code paths.
  'groq:compound': 'groq/compound-mini',

  // Legacy fallback. New Kivo routing should prefer Groq IDs above.
  'openai:gpt-5.4-mini': 'gpt-5.4-mini',
};
