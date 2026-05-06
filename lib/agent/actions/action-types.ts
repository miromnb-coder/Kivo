import type { AgentToolName } from '../core/types';

export type AgentActionKind =
  | 'none'
  | 'calendar.read_today'
  | 'calendar.create_event'
  | 'calendar.update_event'
  | 'calendar.delete_event'
  | 'gmail.scan'
  | 'gmail.draft_email'
  | 'gmail.send_email'
  | 'outlook.scan'
  | 'outlook.draft_email'
  | 'outlook.send_email'
  | 'memory.remember'
  | 'memory.forget'
  | 'memory.review'
  | 'drive.search'
  | 'drive.summarize_file'
  | 'web.search';

export type AgentActionStatus =
  | 'none'
  | 'ready'
  | 'needs_clarification'
  | 'needs_confirmation'
  | 'running'
  | 'success'
  | 'failed'
  | 'blocked'
  | 'unsafe';

export type AgentActionRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high';

export type AgentActionCategory =
  | 'calendar'
  | 'email'
  | 'memory'
  | 'drive'
  | 'web'
  | 'general';

export type CalendarCreatePayload = {
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  location?: string;
  description?: string;
};

export type CalendarUpdatePayload = {
  eventId?: string;
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  location?: string;
  description?: string;
};

export type CalendarDeletePayload = {
  eventId?: string;
};

export type EmailPayload = {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  provider?: 'gmail' | 'outlook' | 'auto';
};

export type MemoryPayload = {
  content?: string;
  type?:
    | 'preference'
    | 'fact'
    | 'personal_fact'
    | 'project'
    | 'goal'
    | 'routine'
    | 'constraint'
    | 'integration_status';
  importance?: 1 | 2 | 3 | 4 | 5;
};

export type DrivePayload = {
  query?: string;
  fileId?: string;
  fileName?: string;
};

export type WebSearchPayload = {
  query?: string;
  country?: string;
};

export type AgentActionPayload = {
  calendarCreate?: CalendarCreatePayload;
  calendarUpdate?: CalendarUpdatePayload;
  calendarDelete?: CalendarDeletePayload;
  email?: EmailPayload;
  memory?: MemoryPayload;
  drive?: DrivePayload;
  webSearch?: WebSearchPayload;
};

export type AgentAction = {
  id: string;
  kind: AgentActionKind;
  status: AgentActionStatus;
  category: AgentActionCategory;
  tool: AgentToolName | 'none';

  confidence: number;
  riskLevel: AgentActionRiskLevel;

  reason: string;
  userVisibleLabel: string;

  requiresConfirmation: boolean;
  missingFields: string[];

  payload: AgentActionPayload;

  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type AgentActionResult = {
  actionId: string;
  kind: AgentActionKind;
  status: AgentActionStatus;
  success: boolean;
  tool: AgentToolName | 'none';

  message: string;
  userVisibleMessage?: string;

  data?: unknown;
  error?: string;

  verified: boolean;
  completedAt: string;
  metadata?: Record<string, unknown>;
};

export type AgentActionExecutionContext = {
  userId?: string;
  timezone?: string;
  locale?: string;
  conversationId?: string;
};

export const EMPTY_AGENT_ACTION: AgentAction = {
  id: 'none',
  kind: 'none',
  status: 'none',
  category: 'general',
  tool: 'none',
  confidence: 0,
  riskLevel: 'none',
  reason: 'No executable action detected.',
  userVisibleLabel: 'No action',
  requiresConfirmation: false,
  missingFields: [],
  payload: {},
  createdAt: new Date(0).toISOString(),
};

export function createActionId(kind: AgentActionKind) {
  const safeKind = kind.replace(/[^a-z0-9._-]/gi, '-');
  return `${safeKind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isCalendarAction(kind: AgentActionKind) {
  return kind.startsWith('calendar.');
}

export function isEmailAction(kind: AgentActionKind) {
  return (
    kind.startsWith('gmail.') ||
    kind.startsWith('outlook.') ||
    kind === 'gmail.draft_email' ||
    kind === 'gmail.send_email' ||
    kind === 'outlook.draft_email' ||
    kind === 'outlook.send_email'
  );
}

export function isMemoryAction(kind: AgentActionKind) {
  return kind.startsWith('memory.');
}

export function isDriveAction(kind: AgentActionKind) {
  return kind.startsWith('drive.');
}

export function isWebAction(kind: AgentActionKind) {
  return kind.startsWith('web.');
}

export function getActionCategory(kind: AgentActionKind): AgentActionCategory {
  if (isCalendarAction(kind)) return 'calendar';
  if (isEmailAction(kind)) return 'email';
  if (isMemoryAction(kind)) return 'memory';
  if (isDriveAction(kind)) return 'drive';
  if (isWebAction(kind)) return 'web';
  return 'general';
}

export function getToolForAction(kind: AgentActionKind): AgentToolName | 'none' {
  switch (kind) {
    case 'calendar.read_today':
    case 'calendar.create_event':
    case 'calendar.update_event':
    case 'calendar.delete_event':
      return 'google_calendar';

    case 'gmail.scan':
    case 'gmail.draft_email':
    case 'gmail.send_email':
      return 'gmail';

    case 'outlook.scan':
    case 'outlook.draft_email':
    case 'outlook.send_email':
      return 'outlook';

    case 'memory.remember':
    case 'memory.forget':
    case 'memory.review':
      return 'memory';

    case 'drive.search':
    case 'drive.summarize_file':
      return 'google_drive';

    case 'web.search':
      return 'web_search';

    case 'none':
    default:
      return 'none';
  }
}

export function getDefaultRiskLevel(kind: AgentActionKind): AgentActionRiskLevel {
  switch (kind) {
    case 'calendar.read_today':
    case 'gmail.scan':
    case 'outlook.scan':
    case 'memory.review':
    case 'drive.search':
    case 'drive.summarize_file':
    case 'web.search':
      return 'low';

    case 'calendar.create_event':
    case 'calendar.update_event':
    case 'gmail.draft_email':
    case 'outlook.draft_email':
    case 'memory.remember':
      return 'medium';

    case 'calendar.delete_event':
    case 'gmail.send_email':
    case 'outlook.send_email':
    case 'memory.forget':
      return 'high';

    case 'none':
    default:
      return 'none';
  }
}

export function shouldRequireConfirmation(kind: AgentActionKind) {
  switch (kind) {
    case 'calendar.delete_event':
    case 'gmail.send_email':
    case 'outlook.send_email':
    case 'memory.forget':
      return true;

    default:
      return false;
  }
}

export function isExecutableAction(action: AgentAction) {
  return (
    action.kind !== 'none' &&
    action.status === 'ready' &&
    action.missingFields.length === 0 &&
    !action.requiresConfirmation
  );
}

export function needsActionClarification(action: AgentAction) {
  return action.kind !== 'none' && action.status === 'needs_clarification';
}

export function needsActionConfirmation(action: AgentAction) {
  return (
    action.kind !== 'none' &&
    (action.status === 'needs_confirmation' || action.requiresConfirmation)
  );
}

export function actionSucceeded(result?: AgentActionResult | null) {
  return Boolean(result?.success && result.verified && result.status === 'success');
}

export function actionFailed(result?: AgentActionResult | null) {
  return Boolean(result && !result.success);
}

export function buildBlockedActionResult(
  action: AgentAction,
  message: string,
  error?: string,
): AgentActionResult {
  return {
    actionId: action.id,
    kind: action.kind,
    status: 'blocked',
    success: false,
    tool: action.tool,
    message,
    userVisibleMessage: message,
    error,
    verified: false,
    completedAt: new Date().toISOString(),
  };
}

export function buildFailedActionResult(
  action: AgentAction,
  message: string,
  error?: string,
): AgentActionResult {
  return {
    actionId: action.id,
    kind: action.kind,
    status: 'failed',
    success: false,
    tool: action.tool,
    message,
    userVisibleMessage: message,
    error,
    verified: false,
    completedAt: new Date().toISOString(),
  };
}

export function buildSuccessfulActionResult(
  action: AgentAction,
  message: string,
  data?: unknown,
): AgentActionResult {
  return {
    actionId: action.id,
    kind: action.kind,
    status: 'success',
    success: true,
    tool: action.tool,
    message,
    userVisibleMessage: message,
    data,
    verified: true,
    completedAt: new Date().toISOString(),
  };
}
