import { runKivoModel } from '@/lib/ai/model-router';
import type { AgentRequest, AgentToolName } from '../core/types';

export type AgentActionKind =
  | 'none'
  | 'calendar.create_event'
  | 'calendar.read_today'
  | 'gmail.scan'
  | 'outlook.scan'
  | 'email.draft'
  | 'email.send'
  | 'memory.remember'
  | 'memory.forget'
  | 'drive.search';

export type AgentActionStatus =
  | 'none'
  | 'ready'
  | 'needs_clarification'
  | 'blocked'
  | 'unsafe';

export type CalendarCreatePayload = {
  title?: string;
  startDateTime?: string;
  endDateTime?: string;
  timeZone?: string;
  location?: string;
  description?: string;
};

export type EmailPayload = {
  to?: string;
  subject?: string;
  body?: string;
  provider?: 'gmail' | 'outlook' | 'auto';
};

export type MemoryPayload = {
  content?: string;
  type?: 'preference' | 'fact' | 'personal_fact' | 'project' | 'goal' | 'routine' | 'constraint';
};

export type DrivePayload = {
  query?: string;
};

export type AgentAction = {
  kind: AgentActionKind;
  status: AgentActionStatus;
  tool: AgentToolName | 'none';
  confidence: number;
  reason: string;
  requiresConfirmation: boolean;
  missingFields: string[];
  payload: {
    calendar?: CalendarCreatePayload;
    email?: EmailPayload;
    memory?: MemoryPayload;
    drive?: DrivePayload;
  };
};

const EMPTY_ACTION: AgentAction = {
  kind: 'none',
  status: 'none',
  tool: 'none',
  confidence: 0,
  reason: 'No executable action detected.',
  requiresConfirmation: false,
  missingFields: [],
  payload: {},
};

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/@.:_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampConfidence(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0.5;
  return Math.max(0, Math.min(1, number));
}

function extractJsonObject(text: string) {
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) return clean;

  return clean.slice(start, end + 1);
}

function normalizeActionKind(value: unknown): AgentActionKind {
  const kind = toText(value);

  const allowed: AgentActionKind[] = [
    'none',
    'calendar.create_event',
    'calendar.read_today',
    'gmail.scan',
    'outlook.scan',
    'email.draft',
    'email.send',
    'memory.remember',
    'memory.forget',
    'drive.search',
  ];

  return allowed.includes(kind as AgentActionKind) ? (kind as AgentActionKind) : 'none';
}

function normalizeStatus(value: unknown): AgentActionStatus {
  const status = toText(value);

  const allowed: AgentActionStatus[] = [
    'none',
    'ready',
    'needs_clarification',
    'blocked',
    'unsafe',
  ];

  return allowed.includes(status as AgentActionStatus) ? (status as AgentActionStatus) : 'none';
}

function toolForAction(kind: AgentActionKind): AgentAction['tool'] {
  switch (kind) {
    case 'calendar.create_event':
    case 'calendar.read_today':
      return 'google_calendar';

    case 'gmail.scan':
      return 'gmail';

    case 'outlook.scan':
      return 'outlook';

    case 'email.draft':
    case 'email.send':
      return 'outlook';

    case 'memory.remember':
    case 'memory.forget':
      return 'memory';

    case 'drive.search':
      return 'google_drive';

    case 'none':
    default:
      return 'none';
  }
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(toText).filter(Boolean);
}

function cleanCalendarPayload(value: unknown): CalendarCreatePayload {
  if (!value || typeof value !== 'object') return {};

  const raw = value as Record<string, unknown>;

  return {
    title: toText(raw.title) || undefined,
    startDateTime: toText(raw.startDateTime) || undefined,
    endDateTime: toText(raw.endDateTime) || undefined,
    timeZone: toText(raw.timeZone) || undefined,
    location: toText(raw.location) || undefined,
    description: toText(raw.description) || undefined,
  };
}

function cleanEmailPayload(value: unknown): EmailPayload {
  if (!value || typeof value !== 'object') return {};

  const raw = value as Record<string, unknown>;
  const provider = toText(raw.provider);

  return {
    to: toText(raw.to) || undefined,
    subject: toText(raw.subject) || undefined,
    body: toText(raw.body) || undefined,
    provider:
      provider === 'gmail' || provider === 'outlook' || provider === 'auto'
        ? provider
        : 'auto',
  };
}

function cleanMemoryPayload(value: unknown): MemoryPayload {
  if (!value || typeof value !== 'object') return {};

  const raw = value as Record<string, unknown>;
  const type = toText(raw.type);

  return {
    content: toText(raw.content) || undefined,
    type:
      type === 'preference' ||
      type === 'fact' ||
      type === 'personal_fact' ||
      type === 'project' ||
      type === 'goal' ||
      type === 'routine' ||
      type === 'constraint'
        ? type
        : undefined,
  };
}

function cleanDrivePayload(value: unknown): DrivePayload {
  if (!value || typeof value !== 'object') return {};

  const raw = value as Record<string, unknown>;

  return {
    query: toText(raw.query) || undefined,
  };
}

function validateCalendarCreate(payload: CalendarCreatePayload) {
  const missing: string[] = [];

  if (!payload.title) missing.push('title');
  if (!payload.startDateTime) missing.push('startDateTime');
  if (!payload.endDateTime) missing.push('endDateTime');

  return missing;
}

function validateEmailSend(payload: EmailPayload) {
  const missing: string[] = [];

  if (!payload.to) missing.push('to');
  if (!payload.subject) missing.push('subject');
  if (!payload.body) missing.push('body');

  return missing;
}

function validateMemoryAction(payload: MemoryPayload) {
  const missing: string[] = [];

  if (!payload.content) missing.push('content');

  return missing;
}

function validateDriveSearch(payload: DrivePayload) {
  const missing: string[] = [];

  if (!payload.query) missing.push('query');

  return missing;
}

function normalizeAction(raw: unknown): AgentAction {
  if (!raw || typeof raw !== 'object') return EMPTY_ACTION;

  const data = raw as Record<string, unknown>;
  const kind = normalizeActionKind(data.kind);
  const payloadRaw = data.payload && typeof data.payload === 'object'
    ? (data.payload as Record<string, unknown>)
    : {};

  const payload = {
    calendar: cleanCalendarPayload(payloadRaw.calendar),
    email: cleanEmailPayload(payloadRaw.email),
    memory: cleanMemoryPayload(payloadRaw.memory),
    drive: cleanDrivePayload(payloadRaw.drive),
  };

  let missingFields = stringArray(data.missingFields);

  if (kind === 'calendar.create_event') {
    missingFields = Array.from(new Set([...missingFields, ...validateCalendarCreate(payload.calendar)]));
  }

  if (kind === 'email.send') {
    missingFields = Array.from(new Set([...missingFields, ...validateEmailSend(payload.email)]));
  }

  if (kind === 'memory.remember' || kind === 'memory.forget') {
    missingFields = Array.from(new Set([...missingFields, ...validateMemoryAction(payload.memory)]));
  }

  if (kind === 'drive.search') {
    missingFields = Array.from(new Set([...missingFields, ...validateDriveSearch(payload.drive)]));
  }

  const unsafe = Boolean(data.unsafe);
  const statusFromModel = normalizeStatus(data.status);

  const status: AgentActionStatus =
    kind === 'none'
      ? 'none'
      : unsafe
        ? 'unsafe'
        : missingFields.length > 0
          ? 'needs_clarification'
          : statusFromModel === 'none'
            ? 'ready'
            : statusFromModel;

  return {
    kind,
    status,
    tool: toolForAction(kind),
    confidence: clampConfidence(data.confidence),
    reason: toText(data.reason) || 'Action classified.',
    requiresConfirmation: Boolean(data.requiresConfirmation),
    missingFields,
    payload,
  };
}

function fallbackActionFromText(message: string): AgentAction {
  const text = normalizeText(message);

  if (!text) return EMPTY_ACTION;

  const mentionsCalendar =
    text.includes('calendar') ||
    text.includes('schedule') ||
    text.includes('event') ||
    text.includes('meeting');

  const createSignal =
    text.includes('add') ||
    text.includes('create') ||
    text.includes('book') ||
    text.includes('schedule');

  if (mentionsCalendar && createSignal) {
    return {
      kind: 'calendar.create_event',
      status: 'needs_clarification',
      tool: 'google_calendar',
      confidence: 0.55,
      reason: 'Fallback detected a possible calendar event creation request.',
      requiresConfirmation: false,
      missingFields: ['title', 'startDateTime', 'endDateTime'],
      payload: {
        calendar: {},
      },
    };
  }

  if (text.includes('gmail')) {
    return {
      kind: 'gmail.scan',
      status: 'ready',
      tool: 'gmail',
      confidence: 0.65,
      reason: 'Fallback detected a Gmail scan request.',
      requiresConfirmation: false,
      missingFields: [],
      payload: {},
    };
  }

  if (text.includes('outlook')) {
    return {
      kind: 'outlook.scan',
      status: 'ready',
      tool: 'outlook',
      confidence: 0.65,
      reason: 'Fallback detected an Outlook scan request.',
      requiresConfirmation: false,
      missingFields: [],
      payload: {},
    };
  }

  if (text.includes('remember')) {
    return {
      kind: 'memory.remember',
      status: 'needs_clarification',
      tool: 'memory',
      confidence: 0.55,
      reason: 'Fallback detected a memory save request.',
      requiresConfirmation: false,
      missingFields: ['content'],
      payload: {
        memory: {},
      },
    };
  }

  return EMPTY_ACTION;
}

export async function routeAgentAction(req: AgentRequest): Promise<AgentAction> {
  const message = toText(req.message);

  if (!message) return EMPTY_ACTION;

  try {
    const result = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      temperature: 0,
      maxTokens: 650,
      messages: [
        {
          role: 'system',
          content: [
            'You are an action router for a personal AI operator.',
            'Return strict JSON only. No markdown. No explanation.',
            '',
            'Your job is to detect whether the user is asking the assistant to perform a real action using a tool.',
            '',
            'Allowed action kinds:',
            '- none',
            '- calendar.create_event',
            '- calendar.read_today',
            '- gmail.scan',
            '- outlook.scan',
            '- email.draft',
            '- email.send',
            '- memory.remember',
            '- memory.forget',
            '- drive.search',
            '',
            'Important safety rules:',
            '- If the user only asks a question, use kind "none".',
            '- If the user asks to create, add, send, delete, update, save, remember, or search connected data, choose the correct action.',
            '- Do not mark an action ready if required fields are missing.',
            '- For calendar.create_event, required fields are title, startDateTime, endDateTime.',
            '- For email.send, required fields are to, subject, body.',
            '- For memory.remember and memory.forget, required field is content.',
            '- For drive.search, required field is query.',
            '- Never invent exact dates or times. If the user gives relative time, convert only if obvious from the current date context. Otherwise mark missingFields.',
            '- Destructive or external actions should set requiresConfirmation true.',
            '- Calendar create is allowed without extra confirmation only when all fields are clear.',
            '- Email send should require confirmation unless the user explicitly says to send now.',
            '- Use ISO-like datetime strings when possible.',
            '',
            'JSON shape:',
            JSON.stringify({
              kind: 'calendar.create_event',
              status: 'ready',
              confidence: 0.9,
              reason: 'User clearly asked to add an event.',
              requiresConfirmation: false,
              unsafe: false,
              missingFields: [],
              payload: {
                calendar: {
                  title: 'Example event',
                  startDateTime: '2026-05-07T15:00:00',
                  endDateTime: '2026-05-07T15:30:00',
                  timeZone: 'Europe/Helsinki',
                  location: '',
                  description: '',
                },
                email: {
                  to: '',
                  subject: '',
                  body: '',
                  provider: 'auto',
                },
                memory: {
                  content: '',
                  type: 'fact',
                },
                drive: {
                  query: '',
                },
              },
            }),
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `User timezone: ${req.timezone ?? 'unknown'}`,
            `User locale: ${req.locale ?? 'unknown'}`,
            '',
            'User message:',
            message,
          ].join('\n'),
        },
      ],
    });

    return normalizeAction(JSON.parse(extractJsonObject(result.content)));
  } catch {
    return fallbackActionFromText(message);
  }
}

export function isExecutableAction(action: AgentAction) {
  return action.kind !== 'none' && action.status === 'ready' && action.missingFields.length === 0;
}

export function needsActionClarification(action: AgentAction) {
  return action.kind !== 'none' && action.status === 'needs_clarification';
}

export function shouldConfirmBeforeAction(action: AgentAction) {
  return action.kind !== 'none' && action.requiresConfirmation;
}
