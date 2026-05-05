import type {
  KivoAgentId,
  KivoContextId,
  KivoModeId,
  KivoModelId,
} from '@/lib/ai/models';

export type AgentStepStatus =
  | 'pending'
  | 'active'
  | 'running'
  | 'done'
  | 'failed'
  | 'skipped';

export type AgentStepKind =
  | 'think'
  | 'plan'
  | 'tool'
  | 'search'
  | 'browser'
  | 'read'
  | 'write'
  | 'memory'
  | 'calendar'
  | 'email'
  | 'file'
  | 'finance'
  | 'done';

export type AgentStep = {
  id?: string;
  label?: string;
  title?: string;
  detail?: string;
  status: AgentStepStatus;
  kind?: AgentStepKind;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type AgentIntent =
  | 'chat'
  | 'plan'
  | 'research'
  | 'finance'
  | 'personal_operator'
  | 'calendar'
  | 'email'
  | 'memory'
  | 'project'
  | 'settings';

export type AgentProvider = 'groq' | 'openai';

export type AgentRequest = {
  message: string;
  agent: KivoAgentId;
  mode: KivoModeId;
  context: KivoContextId;
  userId?: string;

  conversationId?: string;
  timezone?: string;
  locale?: string;

  attachments?: AgentAttachment[];
  metadata?: Record<string, unknown>;
};

export type AgentAttachment = {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  size?: number;
  metadata?: Record<string, unknown>;
};

export type AgentPlan = {
  intent: AgentIntent;
  summary: string;
  needsTools: boolean;
  steps: AgentStep[];
  confidence?: number;
  requiredTools?: AgentToolName[];
};

export type AgentToolName =
  | 'memory'
  | 'gmail'
  | 'google_calendar'
  | 'google_drive'
  | 'outlook'
  | 'outlook_mail'
  | 'outlook_calendar'
  | 'web_search'
  | 'finance'
  | 'browser'
  | 'none';

export type AgentToolStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'failed'
  | 'needs_reconnect'
  | 'not_connected'
  | 'permission_required';

export type AgentToolResult<TData = unknown> = {
  tool: AgentToolName;
  status: AgentToolStatus;
  success: boolean;
  connected?: boolean;
  data?: TData;
  error?: string;
  warning?: string;
  metadata?: Record<string, unknown>;
};

export type AgentVerifiedAction = {
  action: string;
  success: boolean;
  tool?: AgentToolName;
  label?: string;
  error?: string;
  metadata?: Record<string, unknown>;
};

export type AgentMemoryType =
  | 'preference'
  | 'fact'
  | 'personal_fact'
  | 'project'
  | 'goal'
  | 'routine'
  | 'constraint'
  | 'integration_status';

export type AgentMemoryItem = {
  id?: string;
  type: AgentMemoryType;
  content: string;
  importance?: number;
  source?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
};

export type AgentMemoryContext = {
  profileSummary: string;
  preferences: string[];
  recentContext: string[];

  insights?: string[];
  proactiveSuggestions?: string[];

  activeProjects?: string[];
  goals?: string[];
  routines?: string[];
  constraints?: string[];
  integrations?: string[];

  raw?: AgentMemoryItem[];
};

export type AgentSource = {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  publishedAt?: string;
};

export type AgentDocumentCard = {
  title: string;
  type: 'Markdown' | 'Text' | 'Code' | 'Report' | string;
  content: string;
  metadata?: Record<string, unknown>;
};

export type AgentStructuredData = {
  memory?: {
    used: boolean;
    hasProfile?: boolean;
    memories?: number;
    recentContext?: number;
  };

  gmail?: unknown;
  calendar?: unknown;
  outlook?: unknown;
  drive?: unknown;
  finance?: unknown;

  documentCard?: AgentDocumentCard | null;

  sources?: AgentSource[];

  webSearch?: {
    used: boolean;
    fallback?: boolean;
    country?: string | null;
  };

  routing?: unknown;

  actions?: AgentVerifiedAction[];

  [key: string]: unknown;
};

export type AgentResult = {
  answer: string;
  steps: AgentStep[];
  intent: AgentIntent;

  model?: KivoModelId;
  provider?: AgentProvider;

  structuredData?: AgentStructuredData | unknown;

  sources?: AgentSource[];
  toolResults?: AgentToolResult[];
  actions?: AgentVerifiedAction[];

  error?: string;
  metadata?: Record<string, unknown>;
};
