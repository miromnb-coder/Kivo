import type { KivoAgentId, KivoContextId, KivoModeId, KivoModelId } from '@/lib/ai/models';

export type AgentStepStatus = 'pending' | 'active' | 'done' | 'failed';

export type AgentStep = {
  id: string;
  label: string;
  status: AgentStepStatus;
};

export type AgentIntent = 'chat' | 'plan' | 'research' | 'finance' | 'personal_operator';

export type AgentRequest = {
  message: string;
  agent: KivoAgentId;
  mode: KivoModeId;
  context: KivoContextId;
  userId?: string;
};

export type AgentPlan = {
  intent: AgentIntent;
  summary: string;
  needsTools: boolean;
  steps: AgentStep[];
};

export type AgentMemoryContext = {
  profileSummary: string;
  preferences: string[];
  recentContext: string[];
};

export type AgentResult = {
  answer: string;
  steps: AgentStep[];
  intent: AgentIntent;
  model?: KivoModelId;
  provider?: 'groq' | 'openai';
  structuredData?: unknown;
};
