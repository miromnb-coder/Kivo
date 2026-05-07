import { createSupabaseServer } from '@/lib/supabase/server';
import { runKivoModel } from '@/lib/ai/model-router';
import type { AgentToolName, AgentToolResult } from '../core/types';
import {
  createCalendarEventTool,
  runCalendarTodayTool,
  type CalendarActionResult,
  type CalendarTodayToolResult,
  type CreateCalendarEventInput,
} from './calendar';
import { runGmailTool, type GmailToolResult } from './gmail';
import { runOutlookTool, type OutlookToolResult } from './outlook';

export type ToolCapability =
  | 'read'
  | 'write'
  | 'search'
  | 'summarize'
  | 'create'
  | 'update'
  | 'delete'
  | 'send'
  | 'draft'
  | 'analyze';

export type ToolRiskLevel = 'none' | 'low' | 'medium' | 'high';

export type ToolAvailability =
  | 'available'
  | 'not_connected'
  | 'needs_reconnect'
  | 'permission_required'
  | 'not_implemented'
  | 'disabled'
  | 'error';

export type RegisteredToolDefinition = {
  name: AgentToolName;
  label: string;
  description: string;
  category:
    | 'memory'
    | 'email'
    | 'calendar'
    | 'files'
    | 'web'
    | 'finance'
    | 'browser'
    | 'system';

  provider?: 'google' | 'microsoft' | 'groq' | 'internal' | 'custom';

  capabilities: ToolCapability[];
  riskLevel: ToolRiskLevel;

  requiresUser: boolean;
  requiresConnection: boolean;
  requiredScopes?: string[];

  canRead: boolean;
  canWrite: boolean;
  canRunNow: boolean;

  implemented: boolean;
  enabled: boolean;

  reconnectMessage?: string;
};

export type ToolHealth = {
  tool: AgentToolName;
  availability: ToolAvailability;
  connected: boolean;
  implemented: boolean;
  enabled: boolean;
  canRead: boolean;
  canWrite: boolean;
  status: string;
  message?: string;
  provider?: string;
  scopes?: string[];
  checkedAt: string;
  metadata?: Record<string, unknown>;
};

export type ToolRunInput =
  | {
      tool: 'google_calendar';
      action: 'read_today';
      userId?: string;
    }
  | {
      tool: 'google_calendar';
      action: 'create_event';
      userId?: string;
      input: CreateCalendarEventInput;
    }
  | {
      tool: 'gmail';
      action: 'scan';
      userId?: string;
    }
  | {
      tool: 'outlook' | 'outlook_mail' | 'outlook_calendar';
      action: 'scan';
      userId?: string;
    }
  | {
      tool: 'web_search';
      action: 'search';
      query: string;
      country?: string;
    }
  | {
      tool: Exclude<
        AgentToolName,
        'google_calendar' | 'gmail' | 'outlook' | 'outlook_mail' | 'outlook_calendar' | 'web_search'
      >;
      action?: string;
      userId?: string;
      input?: unknown;
    };

const TOOL_DEFINITIONS: Record<AgentToolName, RegisteredToolDefinition> = {
  memory: {
    name: 'memory',
    label: 'Memory',
    description: 'Stores and retrieves useful long-term user context.',
    category: 'memory',
    provider: 'internal',
    capabilities: ['read', 'write', 'analyze'],
    riskLevel: 'medium',
    requiresUser: true,
    requiresConnection: false,
    canRead: true,
    canWrite: true,
    canRunNow: true,
    implemented: true,
    enabled: true,
  },

  gmail: {
    name: 'gmail',
    label: 'Gmail',
    description: 'Reads recent Gmail messages and detects important items, bills, and low-priority email.',
    category: 'email',
    provider: 'google',
    capabilities: ['read', 'search', 'analyze'],
    riskLevel: 'low',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    canRead: true,
    canWrite: false,
    canRunNow: true,
    implemented: true,
    enabled: true,
    reconnectMessage: 'Reconnect Gmail with mail read permission.',
  },

  google_calendar: {
    name: 'google_calendar',
    label: 'Google Calendar',
    description: 'Reads today’s calendar and can create verified calendar events.',
    category: 'calendar',
    provider: 'google',
    capabilities: ['read', 'write', 'create'],
    riskLevel: 'medium',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    canRead: true,
    canWrite: true,
    canRunNow: true,
    implemented: true,
    enabled: true,
    reconnectMessage: 'Reconnect Google Calendar with calendar read/write permission.',
  },

  google_drive: {
    name: 'google_drive',
    label: 'Google Drive',
    description: 'Searches and summarizes Drive files. Placeholder until Drive tool implementation is added.',
    category: 'files',
    provider: 'google',
    capabilities: ['read', 'search', 'summarize'],
    riskLevel: 'low',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ],
    canRead: true,
    canWrite: false,
    canRunNow: false,
    implemented: false,
    enabled: true,
    reconnectMessage: 'Connect Google Drive before Kivo can read files.',
  },

  outlook: {
    name: 'outlook',
    label: 'Outlook',
    description: 'Reads Outlook mail and calendar context through Microsoft Graph.',
    category: 'email',
    provider: 'microsoft',
    capabilities: ['read', 'search', 'analyze'],
    riskLevel: 'low',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: [
      'User.Read',
      'Mail.Read',
      'Calendars.Read',
    ],
    canRead: true,
    canWrite: false,
    canRunNow: true,
    implemented: true,
    enabled: true,
    reconnectMessage: 'Reconnect Outlook with Mail.Read and Calendars.Read permission.',
  },

  outlook_mail: {
    name: 'outlook_mail',
    label: 'Outlook Mail',
    description: 'Reads Outlook email context. Uses the shared Outlook scanner for now.',
    category: 'email',
    provider: 'microsoft',
    capabilities: ['read', 'search', 'analyze'],
    riskLevel: 'low',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: ['User.Read', 'Mail.Read'],
    canRead: true,
    canWrite: false,
    canRunNow: true,
    implemented: true,
    enabled: true,
    reconnectMessage: 'Reconnect Outlook Mail with Mail.Read permission.',
  },

  outlook_calendar: {
    name: 'outlook_calendar',
    label: 'Outlook Calendar',
    description: 'Reads Outlook calendar context. Uses the shared Outlook scanner for now.',
    category: 'calendar',
    provider: 'microsoft',
    capabilities: ['read', 'search', 'analyze'],
    riskLevel: 'low',
    requiresUser: true,
    requiresConnection: true,
    requiredScopes: ['User.Read', 'Calendars.Read'],
    canRead: true,
    canWrite: false,
    canRunNow: true,
    implemented: true,
    enabled: true,
    reconnectMessage: 'Reconnect Outlook Calendar with Calendars.Read permission.',
  },

  web_search: {
    name: 'web_search',
    label: 'Web Search',
    description: 'Uses Groq Compound search for current information.',
    category: 'web',
    provider: 'groq',
    capabilities: ['read', 'search', 'summarize'],
    riskLevel: 'low',
    requiresUser: false,
    requiresConnection: false,
    canRead: true,
    canWrite: false,
    canRunNow: true,
    implemented: true,
    enabled: true,
  },

  finance: {
    name: 'finance',
    label: 'Finance',
    description: 'Finance scanner placeholder for subscriptions, bills, and money signals.',
    category: 'finance',
    provider: 'custom',
    capabilities: ['read', 'analyze'],
    riskLevel: 'medium',
    requiresUser: true,
    requiresConnection: true,
    canRead: true,
    canWrite: false,
    canRunNow: false,
    implemented: false,
    enabled: true,
  },

  browser: {
    name: 'browser',
    label: 'Browser',
    description: 'Browser automation placeholder. Disabled until read-only browser automation is implemented safely.',
    category: 'browser',
    provider: 'custom',
    capabilities: ['read', 'search'],
    riskLevel: 'medium',
    requiresUser: false,
    requiresConnection: false,
    canRead: false,
    canWrite: false,
    canRunNow: false,
    implemented: false,
    enabled: false,
  },

  none: {
    name: 'none',
    label: 'No tool',
    description: 'Represents no external tool.',
    category: 'system',
    provider: 'internal',
    capabilities: [],
    riskLevel: 'none',
    requiresUser: false,
    requiresConnection: false,
    canRead: false,
    canWrite: false,
    canRunNow: false,
    implemented: true,
    enabled: true,
  },
};

const GOOGLE_GMAIL_PROVIDERS = ['gmail', 'google_gmail', 'google_mail', 'email'];
const GOOGLE_CALENDAR_PROVIDERS = ['google_calendar', 'google'];
const GOOGLE_DRIVE_PROVIDERS = ['google_drive', 'drive', 'google'];
const MICROSOFT_PROVIDERS = [
  'microsoft',
  'outlook',
  'outlook_mail',
  'outlook_calendar',
  'microsoft_outlook_mail',
  'microsoft_outlook_calendar',
];

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s./:_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scopesToArray(scopes: unknown): string[] {
  if (Array.isArray(scopes)) return scopes.map(String).filter(Boolean);
  if (typeof scopes === 'string') {
    try {
      const parsed = JSON.parse(scopes);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}

    return scopes
      .split(/[,\s]+/g)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }

  return [];
}

function scopeText(scopes: unknown) {
  return scopesToArray(scopes).join(' ').toLowerCase();
}

function hasAnyScope(scopes: unknown, signals: string[]) {
  const text = scopeText(scopes);
  if (!text) return true;
  return signals.some((signal) => text.includes(signal.toLowerCase()));
}

function getProviderKeysForTool(tool: AgentToolName) {
  switch (tool) {
    case 'gmail':
      return GOOGLE_GMAIL_PROVIDERS;

    case 'google_calendar':
      return GOOGLE_CALENDAR_PROVIDERS;

    case 'google_drive':
      return GOOGLE_DRIVE_PROVIDERS;

    case 'outlook':
    case 'outlook_mail':
    case 'outlook_calendar':
      return MICROSOFT_PROVIDERS;

    default:
      return [];
  }
}

function getScopeSignalsForTool(tool: AgentToolName) {
  switch (tool) {
    case 'gmail':
      return ['gmail', 'mail.google.com', 'gmail.readonly', 'gmail.modify'];

    case 'google_calendar':
      return ['calendar', 'calendar.events'];

    case 'google_drive':
      return ['drive', 'drive.readonly', 'drive.metadata'];

    case 'outlook':
      return ['mail.read', 'calendars.read', 'user.read'];

    case 'outlook_mail':
      return ['mail.read', 'user.read'];

    case 'outlook_calendar':
      return ['calendars.read', 'user.read'];

    default:
      return [];
  }
}

function nowIso() {
  return new Date().toISOString();
}

function baseHealth(definition: RegisteredToolDefinition): ToolHealth {
  return {
    tool: definition.name,
    availability: definition.enabled ? 'available' : 'disabled',
    connected: !definition.requiresConnection,
    implemented: definition.implemented,
    enabled: definition.enabled,
    canRead: definition.canRead,
    canWrite: definition.canWrite,
    status: definition.enabled ? 'ready' : 'disabled',
    provider: definition.provider,
    checkedAt: nowIso(),
  };
}

function unavailableHealth(
  definition: RegisteredToolDefinition,
  availability: ToolAvailability,
  message: string,
  metadata?: Record<string, unknown>,
): ToolHealth {
  return {
    ...baseHealth(definition),
    availability,
    connected: false,
    status: availability,
    message,
    metadata,
  };
}

async function findIntegration(userId: string, tool: AgentToolName) {
  const providerKeys = getProviderKeysForTool(tool);
  if (!providerKeys.length) return null;

  const { data } = await createSupabaseServer()
    .from('kivo_integrations')
    .select('id, provider, status, scopes, expires_at, access_token, refresh_token, updated_at')
    .eq('user_id', userId)
    .in('provider', providerKeys)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

function isNeedsReconnectStatus(status: unknown) {
  const text = normalizeText(status);
  return text.includes('needs_reconnect') || text.includes('expired') || text.includes('revoked');
}

function tokenExpired(expiresAt: unknown) {
  const value = toText(expiresAt);
  if (!value) return false;

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;

  return timestamp <= Date.now() + 60_000;
}

async function getConnectionHealth(userId: string | undefined, tool: AgentToolName): Promise<ToolHealth> {
  const definition = getToolDefinition(tool);

  if (!definition.enabled) {
    return unavailableHealth(definition, 'disabled', `${definition.label} is disabled.`);
  }

  if (!definition.implemented) {
    return unavailableHealth(definition, 'not_implemented', `${definition.label} is not implemented yet.`);
  }

  if (definition.name === 'none') {
    return baseHealth(definition);
  }

  if (!definition.requiresUser && !definition.requiresConnection) {
    if (tool === 'web_search' && !process.env.GROQ_API_KEY) {
      return unavailableHealth(definition, 'error', 'Missing GROQ_API_KEY.');
    }

    return baseHealth(definition);
  }

  if (definition.requiresUser && !userId) {
    return unavailableHealth(definition, 'not_connected', 'User is not signed in.');
  }

  if (!definition.requiresConnection) {
    return baseHealth(definition);
  }

  const integration = await findIntegration(userId!, tool);

  if (!integration?.access_token) {
    return unavailableHealth(
      definition,
      'not_connected',
      definition.reconnectMessage ?? `${definition.label} is not connected.`,
    );
  }

  if (isNeedsReconnectStatus(integration.status) || tokenExpired(integration.expires_at)) {
    return unavailableHealth(
      definition,
      'needs_reconnect',
      definition.reconnectMessage ?? `${definition.label} needs to be reconnected.`,
      {
        provider: integration.provider,
        status: integration.status,
      },
    );
  }

  const scopeSignals = getScopeSignalsForTool(tool);

  if (scopeSignals.length && !hasAnyScope(integration.scopes, scopeSignals)) {
    return unavailableHealth(
      definition,
      'permission_required',
      definition.reconnectMessage ?? `${definition.label} needs more permissions.`,
      {
        provider: integration.provider,
        scopes: scopesToArray(integration.scopes),
      },
    );
  }

  return {
    ...baseHealth(definition),
    availability: 'available',
    connected: true,
    status: 'connected',
    message: `${definition.label} is connected.`,
    provider: integration.provider ?? definition.provider,
    scopes: scopesToArray(integration.scopes),
    metadata: {
      integrationId: integration.id,
      status: integration.status,
      updatedAt: integration.updated_at,
    },
  };
}

function resultFromToolData<TData>(
  tool: AgentToolName,
  success: boolean,
  data?: TData,
  error?: string,
): AgentToolResult<TData> {
  return {
    tool,
    status: success ? 'success' : 'failed',
    success,
    connected: success,
    data,
    error,
  };
}

function notImplementedResult(tool: AgentToolName): AgentToolResult {
  const definition = getToolDefinition(tool);

  return {
    tool,
    status: 'failed',
    success: false,
    connected: false,
    error: `${definition.label} is not implemented yet.`,
  };
}

function blockedResult(tool: AgentToolName, message: string): AgentToolResult {
  return {
    tool,
    status: 'failed',
    success: false,
    connected: false,
    error: message,
  };
}

export function getToolDefinition(tool: AgentToolName): RegisteredToolDefinition {
  return TOOL_DEFINITIONS[tool] ?? TOOL_DEFINITIONS.none;
}

export function getToolRegistry() {
  return TOOL_DEFINITIONS;
}

export function listToolDefinitions(options?: {
  includeDisabled?: boolean;
  includeNotImplemented?: boolean;
}) {
  const includeDisabled = options?.includeDisabled ?? true;
  const includeNotImplemented = options?.includeNotImplemented ?? true;

  return Object.values(TOOL_DEFINITIONS).filter((tool) => {
    if (!includeDisabled && !tool.enabled) return false;
    if (!includeNotImplemented && !tool.implemented) return false;
    return true;
  });
}

export async function getToolHealth(tool: AgentToolName, userId?: string): Promise<ToolHealth> {
  try {
    return await getConnectionHealth(userId, tool);
  } catch (error) {
    const definition = getToolDefinition(tool);

    return unavailableHealth(
      definition,
      'error',
      error instanceof Error ? error.message : `${definition.label} health check failed.`,
    );
  }
}

export async function getAllToolHealth(userId?: string) {
  const tools = listToolDefinitions({ includeDisabled: true, includeNotImplemented: true });

  const results = await Promise.allSettled(
    tools.map((tool) => getToolHealth(tool.name, userId)),
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;

    const definition = tools[index];
    return unavailableHealth(
      definition,
      'error',
      result.reason instanceof Error ? result.reason.message : `${definition.label} health check failed.`,
    );
  });
}

export function canToolRead(tool: AgentToolName) {
  const definition = getToolDefinition(tool);
  return Boolean(definition.enabled && definition.implemented && definition.canRead);
}

export function canToolWrite(tool: AgentToolName) {
  const definition = getToolDefinition(tool);
  return Boolean(definition.enabled && definition.implemented && definition.canWrite);
}

export function isToolImplemented(tool: AgentToolName) {
  return Boolean(getToolDefinition(tool).implemented);
}

export function isToolEnabled(tool: AgentToolName) {
  return Boolean(getToolDefinition(tool).enabled);
}

export function isWriteTool(tool: AgentToolName) {
  return canToolWrite(tool);
}

export function toolNeedsConnection(tool: AgentToolName) {
  return Boolean(getToolDefinition(tool).requiresConnection);
}

export function toolRiskLevel(tool: AgentToolName): ToolRiskLevel {
  return getToolDefinition(tool).riskLevel;
}

export async function runRegisteredTool(input: ToolRunInput): Promise<AgentToolResult> {
  const definition = getToolDefinition(input.tool);

  if (!definition.enabled) {
    return blockedResult(input.tool, `${definition.label} is disabled.`);
  }

  if (!definition.implemented) {
    return notImplementedResult(input.tool);
  }

  try {
    switch (input.tool) {
      case 'google_calendar': {
        if (input.action === 'read_today') {
          const result: CalendarTodayToolResult = await runCalendarTodayTool(input.userId);

          return {
            tool: 'google_calendar',
            status: result.error ? 'failed' : 'success',
            success: Boolean(result.connected && !result.error),
            connected: result.connected,
            data: result,
            error: result.error,
          };
        }

        if (input.action === 'create_event') {
          const result: CalendarActionResult = await createCalendarEventTool(input.userId, input.input);

          return {
            tool: 'google_calendar',
            status: result.success ? 'success' : 'failed',
            success: result.success,
            connected: result.connected,
            data: result,
            error: result.error,
          };
        }

        return blockedResult('google_calendar', `Unsupported Google Calendar action: ${input.action}`);
      }

      case 'gmail': {
        const result: GmailToolResult = await runGmailTool(input.userId);

        return {
          tool: 'gmail',
          status: result.error ? 'failed' : 'success',
          success: Boolean(result.connected && !result.error),
          connected: result.connected,
          data: result,
          error: result.error,
        };
      }

      case 'outlook':
      case 'outlook_mail':
      case 'outlook_calendar': {
        const result: OutlookToolResult = await runOutlookTool(input.userId);

        return {
          tool: input.tool,
          status: result.error ? 'failed' : 'success',
          success: Boolean(result.connected && !result.error),
          connected: result.connected,
          data: result,
          error: result.error,
        };
      }

      case 'web_search': {
        if (!input.query.trim()) {
          return blockedResult('web_search', 'Search query is missing.');
        }

        const result = await runKivoModel({
          agent: 'researcher',
          mode: 'ask',
          context: 'general',
          forceModel: 'groq:search',
          webSearch: input.country ? { country: input.country } : {},
          maxTokens: 900,
          messages: [
            {
              role: 'system',
              content: [
                'Use web search to answer with current information.',
                'Be concise and include the most relevant facts.',
                'Do not invent sources.',
              ].join('\n'),
            },
            {
              role: 'user',
              content: input.query,
            },
          ],
        });

        return resultFromToolData('web_search', true, {
          content: result.content,
          sources: result.sources ?? [],
          model: result.model,
          provider: result.provider,
        });
      }

      case 'memory':
      case 'google_drive':
      case 'finance':
      case 'browser':
      case 'none':
      default:
        return notImplementedResult(input.tool);
    }
  } catch (error) {
    return {
      tool: input.tool,
      status: 'failed',
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : `${definition.label} failed.`,
    };
  }
}

export function formatToolHealthForPrompt(health: ToolHealth[]) {
  if (!health.length) return 'Tool registry: no tools checked.';

  return [
    'Tool registry health:',
    ...health.map((item) => {
      const parts = [
        `${item.tool}: ${item.availability}`,
        item.connected ? 'connected' : 'not connected',
        item.implemented ? 'implemented' : 'not implemented',
        item.canRead ? 'read' : '',
        item.canWrite ? 'write' : '',
        item.message ? `message: ${item.message}` : '',
      ].filter(Boolean);

      return `- ${parts.join(' | ')}`;
    }),
  ].join('\n');
}

export function formatToolDefinitionForPrompt(tool: AgentToolName) {
  const definition = getToolDefinition(tool);

  return [
    `Tool: ${definition.name}`,
    `Label: ${definition.label}`,
    `Description: ${definition.description}`,
    `Category: ${definition.category}`,
    `Capabilities: ${definition.capabilities.join(', ') || 'none'}`,
    `Risk: ${definition.riskLevel}`,
    `Implemented: ${definition.implemented ? 'yes' : 'no'}`,
    `Enabled: ${definition.enabled ? 'yes' : 'no'}`,
    `Can read: ${definition.canRead ? 'yes' : 'no'}`,
    `Can write: ${definition.canWrite ? 'yes' : 'no'}`,
  ].join('\n');
}
