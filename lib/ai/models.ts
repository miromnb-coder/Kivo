export type KivoAgentId = 'kivo' | 'planner' | 'researcher' | 'finance' | 'personal';
export type KivoModeId = 'chat' | 'ask' | 'deep';
export type KivoContextId = 'general' | 'work' | 'finance';
export type KivoComplexity = 'low' | 'medium' | 'high';

export type KivoModelId = 'groq:fast' | 'openai:gpt-5.4-mini';

export type KivoModelMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
};

export type KivoModelResult = {
  model: KivoModelId;
  provider: 'groq' | 'openai';
  content: string;
  raw?: unknown;
};

export const KIVO_MODEL_NAMES: Record<KivoModelId, string> = {
  'groq:fast': 'llama-3.3-70b-versatile',
  'openai:gpt-5.4-mini': 'gpt-5.4-mini',
};
