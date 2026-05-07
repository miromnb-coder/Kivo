import { runKivoModel } from '@/lib/ai/model-router';
import type { AgentRequest } from '../core/types';
import {
  type AgentAction,
  type AgentActionKind,
  type AgentActionStatus,
  type CalendarCreatePayload,
  type CalendarDeletePayload,
  type CalendarUpdatePayload,
  type DrivePayload,
  type EmailPayload,
  type MemoryPayload,
  type WebSearchPayload,
  EMPTY_AGENT_ACTION,
  createActionId,
  getActionCategory,
  getDefaultRiskLevel,
  getToolForAction,
  shouldRequireConfirmation,
} from './action-types';

const ALLOWED_ACTION_KINDS: AgentActionKind[] = [
  'none',
  'calendar.read_today',
  'calendar.create_event',
  'calendar.update_event',
  'calendar.delete_event',
  'gmail.scan',
  'gmail.draft_email',
  'gmail.send_email',
  'outlook.scan',
  'outlook.draft_email',
  'outlook.send_email',
  'memory.remember',
  'memory.forget',
  'memory.review',
  'drive.search',
  'drive.summarize_file',
  'web.search',
];

const ALLOWED_STATUSES: AgentActionStatus[] = [
  'none',
  'ready',
  'needs_clarification',
  'needs_confirmation',
  'blocked',
  'unsafe',
];

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
  return ALLOWED_ACTION_KINDS.includes(kind as AgentActionKind) ? (kind as AgentActionKind) : 'none';
}

function normalizeStatus(value: unknown): AgentActionStatus {
  const status = toText(value);
  return ALLOWED_STATUSES.includes(status as AgentActionStatus) ? (status as AgentActionStatus) : 'none';
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(toText).filter(Boolean);
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanCalendarCreatePayload(value: unknown): CalendarCreatePayload {
  const raw = asRecord(value);

  return {
    title: toText(raw.title) || undefined,
    startDateTime: toText(raw.startDateTime) || undefined,
    endDateTime: toText(raw.endDateTime) || undefined,
    timeZone: toText(raw.timeZone) || undefined,
    location: toText(raw.location) || undefined,
    description: toText(raw.description) || undefined,
  };
}

function cleanCalendarUpdatePayload(value: unknown): CalendarUpdatePayload {
  const raw = asRecord(value);

  return {
    eventId: toText(raw.eventId) || undefined,
    title: toText(raw.title) || undefined,
    startDateTime: toText(raw.startDateTime) || undefined,
    endDateTime: toText(raw.endDateTime) || undefined,
    timeZone: toText(raw.timeZone) || undefined,
    location: toText(raw.location) || undefined,
    description: toText(raw.description) || undefined,
  };
}

function cleanCalendarDeletePayload(value: unknown): CalendarDeletePayload {
  const raw = asRecord(value);
  return { eventId: toText(raw.eventId) || undefined };
}

function cleanEmailPayload(value: unknown): EmailPayload {
  const raw = asRecord(value);
  const provider = toText(raw.provider);

  return {
    to: toText(raw.to) || undefined,
    cc: toText(raw.cc) || undefined,
    bcc: toText(raw.bcc) || undefined,
    subject: toText(raw.subject) || undefined,
    body: toText(raw.body) || undefined,
    provider:
      provider === 'gmail' || provider === 'outlook' || provider === 'auto'
        ? provider
        : 'auto',
  };
}

function cleanMemoryPayload(value: unknown): MemoryPayload {
  const raw = asRecord(value);
  const type = toText(raw.type);
  const importance = Number(raw.importance);

  return {
    content: toText(raw.content) || undefined,
    type:
      type === 'preference' ||
      type === 'fact' ||
      type === 'personal_fact' ||
      type === 'project' ||
      type === 'goal' ||
      type === 'routine' ||
      type === 'constraint' ||
      type === 'integration_status'
        ? type
        : undefined,
    importance:
      importance === 1 || importance === 2 || importance === 3 || importance === 4 || importance === 5
        ? importance
        : undefined,
  };
}

function cleanDrivePayload(value: unknown): DrivePayload {
  const raw = asRecord(value);

  return {
    query: toText(raw.query) || undefined,
    fileId: toText(raw.fileId) || undefined,
    fileName: toText(raw.fileName) || undefined,
  };
}

function cleanWebSearchPayload(value: unknown): WebSearchPayload {
  const raw = asRecord(value);

  return {
    query: toText(raw.query) || undefined,
    country: toText(raw.country) || undefined,
  };
}

function validateCalendarCreate(payload: CalendarCreatePayload) {
  const missing: string[] = [];

  if (!payload.title) missing.push('title');
  if (!payload.startDateTime) missing.push('startDateTime');
  if (!payload.endDateTime) missing.push('endDateTime');

  return missing;
}

function validateCalendarUpdate(payload: CalendarUpdatePayload) {
  const missing: string[] = [];
  if (!payload.eventId) missing.push('eventId');
  return missing;
}

function validateCalendarDelete(payload: CalendarDeletePayload) {
  const missing: string[] = [];
  if (!payload.eventId) missing.push('eventId');
  return missing;
}

function validateEmailSend(payload: EmailPayload) {
  const missing: string[] = [];

  if (!payload.to) missing.push('to');
  if (!payload.subject) missing.push('subject');
  if (!payload.body) missing.push('body');

  return missing;
}

function validateMemoryPayload(payload: MemoryPayload) {
  const missing: string[] = [];
  if (!payload.content) missing.push('content');
  return missing;
}

function validateDrivePayload(payload: DrivePayload) {
  const missing: string[] = [];
  if (!payload.query && !payload.fileId && !payload.fileName) missing.push('query');
  return missing;
}

function validateWebSearchPayload(payload: WebSearchPayload) {
  const missing: string[] = [];
  if (!payload.query) missing.push('query');
  return missing;
}

function userVisibleLabelForAction(kind: AgentActionKind) {
  switch (kind) {
    case 'calendar.read_today':
      return 'Check calendar';
    case 'calendar.create_event':
      return 'Create calendar event';
    case 'calendar.update_event':
      return 'Update calendar event';
    case 'calendar.delete_event':
      return 'Delete calendar event';
    case 'gmail.scan':
      return 'Check Gmail';
    case 'gmail.draft_email':
      return 'Draft Gmail email';
    case 'gmail.send_email':
      return 'Send Gmail email';
    case 'outlook.scan':
      return 'Check Outlook';
    case 'outlook.draft_email':
      return 'Draft Outlook email';
    case 'outlook.send_email':
      return 'Send Outlook email';
    case 'memory.remember':
      return 'Save memory';
    case 'memory.forget':
      return 'Forget memory';
    case 'memory.review':
      return 'Review memory';
    case 'drive.search':
      return 'Search Drive';
    case 'drive.summarize_file':
      return 'Summarize Drive file';
    case 'web.search':
      return 'Search web';
    case 'none':
    default:
      return 'No action';
  }
}

function normalizeAction(raw: unknown): AgentAction {
  if (!raw || typeof raw !== 'object') return EMPTY_AGENT_ACTION;

  const data = raw as Record<string, unknown>;
  const kind = normalizeActionKind(data.kind);

  if (kind === 'none') return EMPTY_AGENT_ACTION;

  const payloadRaw = asRecord(data.payload);

  const payload = {
    calendarCreate: cleanCalendarCreatePayload(payloadRaw.calendarCreate ?? payloadRaw.calendar),
    calendarUpdate: cleanCalendarUpdatePayload(payloadRaw.calendarUpdate),
    calendarDelete: cleanCalendarDeletePayload(payloadRaw.calendarDelete),
    email: cleanEmailPayload(payloadRaw.email),
    memory: cleanMemoryPayload(payloadRaw.memory),
    drive: cleanDrivePayload(payloadRaw.drive),
    webSearch: cleanWebSearchPayload(payloadRaw.webSearch),
  };

  let missingFields = stringArray(data.missingFields);

  if (kind === 'calendar.create_event') {
    missingFields = [...missingFields, ...validateCalendarCreate(payload.calendarCreate)];
  }

  if (kind === 'calendar.update_event') {
    missingFields = [...missingFields, ...validateCalendarUpdate(payload.calendarUpdate)];
  }

  if (kind === 'calendar.delete_event') {
    missingFields = [...missingFields, ...validateCalendarDelete(payload.calendarDelete)];
  }

  if (kind === 'gmail.send_email' || kind === 'outlook.send_email') {
    missingFields = [...missingFields, ...validateEmailSend(payload.email)];
  }

  if (kind === 'memory.remember' || kind === 'memory.forget') {
    missingFields = [...missingFields, ...validateMemoryPayload(payload.memory)];
  }

  if (kind === 'drive.search' || kind === 'drive.summarize_file') {
    missingFields = [...missingFields, ...validateDrivePayload(payload.drive)];
  }

  if (kind === 'web.search') {
    missingFields = [...missingFields, ...validateWebSearchPayload(payload.webSearch)];
  }

  missingFields = Array.from(new Set(missingFields.filter(Boolean)));

  const unsafe = Boolean(data.unsafe);
  const requiresConfirmation = Boolean(data.requiresConfirmation) || shouldRequireConfirmation(kind);
  const statusFromModel = normalizeStatus(data.status);

  const status: AgentActionStatus = unsafe
    ? 'unsafe'
    : missingFields.length > 0
      ? 'needs_clarification'
      : requiresConfirmation && statusFromModel !== 'ready'
        ? 'needs_confirmation'
        : statusFromModel === 'none'
          ? 'ready'
          : statusFromModel;

  return {
    id: createActionId(kind),
    kind,
    status,
    category: getActionCategory(kind),
    tool: getToolForAction(kind),
    confidence: clampConfidence(data.confidence),
    riskLevel: getDefaultRiskLevel(kind),
    reason: toText(data.reason) || 'Action classified.',
    userVisibleLabel: toText(data.userVisibleLabel) || userVisibleLabelForAction(kind),
    requiresConfirmation,
    missingFields,
    payload,
    createdAt: new Date().toISOString(),
    metadata: {
      source: 'action-router',
    },
  };
}

function fallbackActionFromText(message: string): AgentAction {
  const text = normalizeText(message);

  if (!text) return EMPTY_AGENT_ACTION;

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
    const kind: AgentActionKind = 'calendar.create_event';

    return {
      id: createActionId(kind),
      kind,
      status: 'needs_clarification',
      category: 'calendar',
      tool: 'google_calendar',
      confidence: 0.55,
      riskLevel: 'medium',
      reason: 'Fallback detected a possible calendar event creation request.',
      userVisibleLabel: userVisibleLabelForAction(kind),
      requiresConfirmation: false,
      missingFields: ['title', 'startDateTime', 'endDateTime'],
      payload: { calendarCreate: {} },
      createdAt: new Date().toISOString(),
      metadata: { source: 'fallback-action-router' },
    };
  }

  if (text.includes('gmail')) {
    const kind: AgentActionKind = 'gmail.scan';

    return {
      id: createActionId(kind),
      kind,
      status: 'ready',
      category: 'email',
      tool: 'gmail',
      confidence: 0.65,
      riskLevel: 'low',
      reason: 'Fallback detected a Gmail scan request.',
      userVisibleLabel: userVisibleLabelForAction(kind),
      requiresConfirmation: false,
      missingFields: [],
      payload: {},
      createdAt: new Date().toISOString(),
      metadata: { source: 'fallback-action-router' },
    };
  }

  if (text.includes('outlook')) {
    const kind: AgentActionKind = 'outlook.scan';

    return {
      id: createActionId(kind),
      kind,
      status: 'ready',
      category: 'email',
      tool: 'outlook',
      confidence: 0.65,
      riskLevel: 'low',
      reason: 'Fallback detected an Outlook scan request.',
      userVisibleLabel: userVisibleLabelForAction(kind),
      requiresConfirmation: false,
      missingFields: [],
      payload: {},
      createdAt: new Date().toISOString(),
      metadata: { source: 'fallback-action-router' },
    };
  }

  return EMPTY_AGENT_ACTION;
}

export async function routeAgentAction(req: AgentRequest): Promise<AgentAction> {
  const message = toText(req.message);

  if (!message) return EMPTY_AGENT_ACTION;

  try {
    const now = new Date().toISOString();

    const result = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:smart',
      temperature: 0,
      maxTokens: 750,
      messages: [
        {
          role: 'system',
          content: [
            'You are an action router for a personal AI operator.',
            'Return strict JSON only. No markdown. No explanation.',
            '',
            'Detect whether the user is asking the assistant to perform a real external action.',
            'If the user is only asking a question or asking for advice, return kind "none".',
            '',
            'Allowed action kinds:',
            ALLOWED_ACTION_KINDS.map((kind) => `- ${kind}`).join('\n'),
            '',
            'Safety rules:',
            '- Do not mark an action ready if required fields are missing.',
            '- Do not invent exact dates, times, recipients, or event IDs.',
            '- Convert relative dates only when they are obvious from the provided current datetime and timezone.',
            '- Destructive actions and send-email actions require confirmation.',
            '- Calendar create is allowed without extra confirmation only when title, startDateTime, and endDateTime are clear.',
            '- Email send must require confirmation unless the user explicitly says to send now and all fields are present.',
            '',
            'Required fields:',
            '- calendar.create_event: calendarCreate.title, calendarCreate.startDateTime, calendarCreate.endDateTime',
            '- calendar.update_event: calendarUpdate.eventId',
            '- calendar.delete_event: calendarDelete.eventId',
            '- gmail.send_email/outlook.send_email: email.to, email.subject, email.body',
            '- memory.remember/memory.forget: memory.content',
            '- drive.search: drive.query',
            '- drive.summarize_file: drive.fileId or drive.fileName or drive.query',
            '- web.search: webSearch.query',
            '',
            'JSON shape:',
            JSON.stringify({
              kind: 'calendar.create_event',
              status: 'ready',
              confidence: 0.9,
              reason: 'User clearly asked to add an event.',
              userVisibleLabel: 'Create calendar event',
              requiresConfirmation: false,
              unsafe: false,
              missingFields: [],
              payload: {
                calendarCreate: {
                  title: 'Example event',
                  startDateTime: '2026-05-07T15:00:00',
                  endDateTime: '2026-05-07T15:30:00',
                  timeZone: 'Europe/Helsinki',
                  location: '',
                  description: '',
                },
                calendarUpdate: { eventId: '' },
                calendarDelete: { eventId: '' },
                email: { to: '', subject: '', body: '', provider: 'auto' },
                memory: { content: '', type: 'fact', importance: 3 },
                drive: { query: '', fileId: '', fileName: '' },
                webSearch: { query: '' },
              },
            }),
          ].join('\n'),
        },
        {
          role: 'user',
          content: [
            `Current datetime: ${now}`,
            `User timezone: ${req.timezone ?? 'Europe/Helsinki'}`,
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
  return action.kind !== 'none' && action.status === 'ready' && action.missingFields.length === 0 && !action.requiresConfirmation;
}

export function needsActionClarification(action: AgentAction) {
  return action.kind !== 'none' && action.status === 'needs_clarification';
}

export function shouldConfirmBeforeAction(action: AgentAction) {
  return action.kind !== 'none' && action.requiresConfirmation;
}
