import {
  type AgentAction,
  type AgentActionExecutionContext,
  type AgentActionKind,
  type AgentActionResult,
  buildBlockedActionResult,
  buildFailedActionResult,
  buildSuccessfulActionResult,
  needsActionConfirmation,
} from './action-types';
import {
  createCalendarEventTool,
  runCalendarTodayTool,
} from '../tools/calendar';
import { runGmailTool } from '../tools/gmail';
import { runOutlookTool } from '../tools/outlook';
import { saveMemory } from '../memory/memory';

type ExecuteOptions = {
  confirmed?: boolean;
};

type LegacyActionPayload = {
  calendar?: {
    title?: string;
    startDateTime?: string;
    endDateTime?: string;
    timeZone?: string;
    location?: string;
    description?: string;
  };
};

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasUser(context: AgentActionExecutionContext) {
  return Boolean(toText(context.userId));
}

function getCalendarCreatePayload(action: AgentAction) {
  const legacyPayload = action.payload as LegacyActionPayload;

  return action.payload.calendarCreate ?? legacyPayload.calendar ?? {};
}

function missingUserResult(action: AgentAction) {
  return buildBlockedActionResult(
    action,
    'You need to sign in before Kivo can run this action.',
    'Missing userId.',
  );
}

function missingFieldsResult(action: AgentAction) {
  return buildBlockedActionResult(
    action,
    `This action needs more information: ${action.missingFields.join(', ')}.`,
    'Missing required action fields.',
  );
}

function confirmationRequiredResult(action: AgentAction) {
  return buildBlockedActionResult(
    action,
    'This action needs confirmation before Kivo can complete it.',
    'Confirmation required.',
  );
}

function unsupportedActionResult(action: AgentAction) {
  return buildBlockedActionResult(
    action,
    `Kivo detected the action "${action.kind}", but this action is not safely implemented yet.`,
    'Unsupported action.',
  );
}

function isActionReady(action: AgentAction, options: ExecuteOptions = {}) {
  if (action.kind === 'none') return false;
  if (action.status === 'unsafe') return false;
  if (action.status === 'blocked') return false;
  if (action.status === 'failed') return false;
  if (action.missingFields.length > 0) return false;
  if (needsActionConfirmation(action) && !options.confirmed) return false;

  return action.status === 'ready' || action.status === 'needs_confirmation';
}

function readableKind(kind: AgentActionKind) {
  return kind.replace(/\./g, ' ');
}

async function executeCalendarReadToday(
  action: AgentAction,
  context: AgentActionExecutionContext,
): Promise<AgentActionResult> {
  if (!hasUser(context)) return missingUserResult(action);

  const result = await runCalendarTodayTool(context.userId);

  if (!result.connected) {
    return buildBlockedActionResult(
      action,
      'Google Calendar is not connected.',
      result.error,
    );
  }

  if (result.error) {
    return buildFailedActionResult(
      action,
      'Calendar check failed.',
      result.error,
    );
  }

  return buildSuccessfulActionResult(
    action,
    `Checked Google Calendar successfully. Found ${result.events.length} event${result.events.length === 1 ? '' : 's'} today.`,
    result,
  );
}

async function executeCalendarCreateEvent(
  action: AgentAction,
  context: AgentActionExecutionContext,
): Promise<AgentActionResult> {
  if (!hasUser(context)) return missingUserResult(action);

  const payload = getCalendarCreatePayload(action);

  const title = toText(payload.title);
  const startDateTime = toText(payload.startDateTime);
  const endDateTime = toText(payload.endDateTime);

  if (!title || !startDateTime || !endDateTime) {
    return buildBlockedActionResult(
      action,
      'Calendar event needs a title, start time, and end time.',
      'Missing calendar event fields.',
    );
  }

  const result = await createCalendarEventTool(context.userId, {
    title,
    startDateTime,
    endDateTime,
    timeZone: toText(payload.timeZone) || context.timezone,
    location: toText(payload.location) || undefined,
    description: toText(payload.description) || undefined,
  });

  if (!result.connected) {
    return buildBlockedActionResult(
      action,
      'Google Calendar is not connected.',
      result.error,
    );
  }

  if (!result.success || !result.event) {
    return buildFailedActionResult(
      action,
      'Calendar event was not created.',
      result.error,
    );
  }

  return buildSuccessfulActionResult(
    action,
    `Created calendar event: ${result.event.summary}`,
    result,
  );
}

async function executeGmailScan(
  action: AgentAction,
  context: AgentActionExecutionContext,
): Promise<AgentActionResult> {
  if (!hasUser(context)) return missingUserResult(action);

  const result = await runGmailTool(context.userId);

  if (!result.connected) {
    return buildBlockedActionResult(
      action,
      'Gmail is not connected.',
      result.error,
    );
  }

  if (result.error) {
    return buildFailedActionResult(
      action,
      'Gmail scan failed.',
      result.error,
    );
  }

  return buildSuccessfulActionResult(
    action,
    `Checked Gmail successfully. Found ${result.messages.length} recent message${result.messages.length === 1 ? '' : 's'}.`,
    result,
  );
}

async function executeOutlookScan(
  action: AgentAction,
  context: AgentActionExecutionContext,
): Promise<AgentActionResult> {
  if (!hasUser(context)) return missingUserResult(action);

  const result = await runOutlookTool(context.userId);

  if (!result.connected) {
    return buildBlockedActionResult(
      action,
      'Outlook is not connected.',
      result.error,
    );
  }

  if (result.error) {
    return buildFailedActionResult(
      action,
      'Outlook scan failed.',
      result.error,
    );
  }

  return buildSuccessfulActionResult(
    action,
    `Checked Outlook successfully. Found ${result.messages.length} recent email${result.messages.length === 1 ? '' : 's'} and ${result.events.length} upcoming event${result.events.length === 1 ? '' : 's'}.`,
    result,
  );
}

async function executeMemoryRemember(
  action: AgentAction,
  context: AgentActionExecutionContext,
): Promise<AgentActionResult> {
  if (!hasUser(context)) return missingUserResult(action);

  const content = toText(action.payload.memory?.content);
  const type = action.payload.memory?.type;
  const importance = action.payload.memory?.importance ?? 3;

  if (!content) {
    return buildBlockedActionResult(
      action,
      'Memory content is missing.',
      'Missing memory content.',
    );
  }

  await saveMemory(context.userId!, content, type, importance);

  return buildSuccessfulActionResult(
    action,
    'Saved this to memory.',
    {
      content,
      type,
      importance,
    },
  );
}

export async function executeAgentAction(
  action: AgentAction,
  context: AgentActionExecutionContext,
  options: ExecuteOptions = {},
): Promise<AgentActionResult> {
  try {
    if (action.kind === 'none') {
      return buildBlockedActionResult(
        action,
        'No executable action was detected.',
        'No action.',
      );
    }

    if (action.status === 'unsafe') {
      return buildBlockedActionResult(
        action,
        'This action was blocked for safety.',
        'Unsafe action.',
      );
    }

    if (action.missingFields.length > 0) {
      return missingFieldsResult(action);
    }

    if (needsActionConfirmation(action) && !options.confirmed) {
      return confirmationRequiredResult(action);
    }

    if (!isActionReady(action, options)) {
      return buildBlockedActionResult(
        action,
        `Action "${readableKind(action.kind)}" is not ready to run.`,
        `Action status: ${action.status}`,
      );
    }

    switch (action.kind) {
      case 'calendar.read_today':
        return executeCalendarReadToday(action, context);

      case 'calendar.create_event':
        return executeCalendarCreateEvent(action, context);

      case 'gmail.scan':
        return executeGmailScan(action, context);

      case 'outlook.scan':
        return executeOutlookScan(action, context);

      case 'memory.remember':
        return executeMemoryRemember(action, context);

      case 'calendar.update_event':
      case 'calendar.delete_event':
      case 'gmail.draft_email':
      case 'gmail.send_email':
      case 'outlook.draft_email':
      case 'outlook.send_email':
      case 'memory.forget':
      case 'memory.review':
      case 'drive.search':
      case 'drive.summarize_file':
      case 'web.search':
      default:
        return unsupportedActionResult(action);
    }
  } catch (error) {
    return buildFailedActionResult(
      action,
      `Action "${readableKind(action.kind)}" failed.`,
      error instanceof Error ? error.message : 'Unknown action execution error.',
    );
  }
}

export function actionResultForPrompt(result: AgentActionResult | null | undefined) {
  if (!result) {
    return [
      'Action result: No action was executed.',
      'Important: Do not claim that any external action was completed.',
    ].join('\n');
  }

  if (result.success && result.verified) {
    return [
      'Action result: Success.',
      `Action: ${result.kind}`,
      `Tool: ${result.tool}`,
      `Message: ${result.message}`,
      'Important: You may accurately say the action was completed.',
    ].join('\n');
  }

  return [
    'Action result: Failed or blocked.',
    `Action: ${result.kind}`,
    `Tool: ${result.tool}`,
    `Message: ${result.message}`,
    result.error ? `Error: ${result.error}` : '',
    'Important: Do not claim that the action was completed.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function canClaimActionCompleted(result: AgentActionResult | null | undefined) {
  return Boolean(result?.success && result.verified && result.status === 'success');
}
