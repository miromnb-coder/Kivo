import {
  type AgentAction,
  type AgentActionKind,
  type AgentActionResult,
  actionSucceeded,
  needsActionClarification,
  needsActionConfirmation,
} from './action-types';

export type ActionVerificationStatus =
  | 'not_applicable'
  | 'not_executed'
  | 'needs_clarification'
  | 'needs_confirmation'
  | 'blocked'
  | 'failed'
  | 'verified_success'
  | 'unverified_success'
  | 'unsafe_claim';

export type ActionVerification = {
  actionId: string;
  kind: AgentActionKind;
  status: ActionVerificationStatus;
  verified: boolean;
  canClaimCompleted: boolean;
  canMentionAttempted: boolean;
  summary: string;
  userVisibleMessage: string;
  problems: string[];
  requiredInstruction: string;
};

const COMPLETION_CLAIM_SIGNALS = [
  'i added',
  'i created',
  'i scheduled',
  'i sent',
  'i deleted',
  'i updated',
  'i saved',
  'added to your calendar',
  'created the event',
  'event has been added',
  'email has been sent',
  'message has been sent',
  'saved to memory',
  'deleted the event',
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

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function hasCompletionClaim(answer: string) {
  const text = normalizeText(answer);
  return COMPLETION_CLAIM_SIGNALS.some((signal) => text.includes(signal));
}

function resultMatchesAction(action: AgentAction, result?: AgentActionResult | null) {
  if (!result) return false;

  return (
    result.actionId === action.id &&
    result.kind === action.kind &&
    result.tool === action.tool
  );
}

function getResultData(result?: AgentActionResult | null) {
  return isObject(result?.data) ? result.data : {};
}

function verifyCalendarCreate(result?: AgentActionResult | null) {
  const data = getResultData(result);
  const event = isObject(data.event) ? data.event : null;

  const eventId = toText(event?.id);
  const summary = toText(event?.summary);
  const start = toText(event?.start);
  const end = toText(event?.end);

  return Boolean(eventId && summary && start && end);
}

function verifyCalendarRead(result?: AgentActionResult | null) {
  const data = getResultData(result);
  return Array.isArray(data.events);
}

function verifyGmailScan(result?: AgentActionResult | null) {
  const data = getResultData(result);
  return Array.isArray(data.messages);
}

function verifyOutlookScan(result?: AgentActionResult | null) {
  const data = getResultData(result);
  return Array.isArray(data.messages) && Array.isArray(data.events);
}

function verifyMemoryRemember(result?: AgentActionResult | null) {
  const data = getResultData(result);
  return Boolean(toText(data.content));
}

function hasExpectedToolEvidence(action: AgentAction, result?: AgentActionResult | null) {
  if (!result?.success || !result.verified) return false;

  switch (action.kind) {
    case 'calendar.create_event':
      return verifyCalendarCreate(result);

    case 'calendar.read_today':
      return verifyCalendarRead(result);

    case 'gmail.scan':
      return verifyGmailScan(result);

    case 'outlook.scan':
      return verifyOutlookScan(result);

    case 'memory.remember':
      return verifyMemoryRemember(result);

    case 'none':
      return false;

    default:
      return actionSucceeded(result);
  }
}

function buildProblems(action: AgentAction, result?: AgentActionResult | null) {
  const problems: string[] = [];

  if (action.kind === 'none') {
    problems.push('No executable action was detected.');
  }

  if (needsActionClarification(action)) {
    problems.push(`Action is missing required fields: ${action.missingFields.join(', ') || 'unknown fields'}.`);
  }

  if (needsActionConfirmation(action)) {
    problems.push('Action requires user confirmation before it can be completed.');
  }

  if (!result) {
    problems.push('No action result is available.');
    return problems;
  }

  if (!resultMatchesAction(action, result)) {
    problems.push('Action result does not match the requested action.');
  }

  if (!result.success) {
    problems.push(result.error || result.message || 'Action did not succeed.');
  }

  if (!result.verified) {
    problems.push('Action result was not verified.');
  }

  if (result.success && result.verified && !hasExpectedToolEvidence(action, result)) {
    problems.push('Action result says success, but expected tool evidence is missing.');
  }

  return problems;
}

function statusForAction(action: AgentAction, result?: AgentActionResult | null): ActionVerificationStatus {
  if (action.kind === 'none') return 'not_applicable';
  if (needsActionClarification(action)) return 'needs_clarification';
  if (needsActionConfirmation(action)) return 'needs_confirmation';
  if (!result) return 'not_executed';
  if (result.status === 'blocked') return 'blocked';
  if (!result.success) return 'failed';
  if (result.success && result.verified && hasExpectedToolEvidence(action, result)) return 'verified_success';
  if (result.success && result.verified) return 'unverified_success';

  return 'failed';
}

function userMessageForStatus(status: ActionVerificationStatus, action: AgentAction, result?: AgentActionResult | null) {
  switch (status) {
    case 'verified_success':
      return result?.userVisibleMessage || result?.message || 'The action was completed successfully.';

    case 'needs_clarification':
      return `I need more information before I can complete this action: ${action.missingFields.join(', ')}.`;

    case 'needs_confirmation':
      return 'I need your confirmation before completing this action.';

    case 'not_executed':
      return 'I did not complete the action because it was not executed.';

    case 'blocked':
      return result?.userVisibleMessage || result?.message || 'The action was blocked.';

    case 'failed':
      return result?.userVisibleMessage || result?.message || 'The action failed.';

    case 'unverified_success':
      return 'The tool returned success, but I could not fully verify the result.';

    case 'unsafe_claim':
      return 'I could not verify that the action was completed.';

    case 'not_applicable':
    default:
      return 'No external action was completed.';
  }
}

function instructionForStatus(status: ActionVerificationStatus) {
  switch (status) {
    case 'verified_success':
      return 'You may accurately say the action was completed. Include only details present in the verified tool result.';

    case 'needs_clarification':
      return 'Ask for the missing information. Do not claim that the action was completed.';

    case 'needs_confirmation':
      return 'Ask for confirmation before completing the action. Do not claim that the action was completed.';

    case 'not_executed':
      return 'Say that the action was not executed. Do not claim completion.';

    case 'blocked':
      return 'Explain briefly why the action was blocked. Do not claim completion.';

    case 'failed':
      return 'Explain briefly that the action failed. Do not claim completion.';

    case 'unverified_success':
      return 'Be cautious: say the tool returned success, but do not overstate details that were not verified.';

    case 'unsafe_claim':
      return 'Replace any completion claim with a verified-safe explanation.';

    case 'not_applicable':
    default:
      return 'No external action was completed. Do not imply that anything was changed.';
  }
}

export function verifyAgentActionResult(
  action: AgentAction,
  result?: AgentActionResult | null,
): ActionVerification {
  const status = statusForAction(action, result);
  const problems = buildProblems(action, result);
  const verified = status === 'verified_success';

  return {
    actionId: action.id,
    kind: action.kind,
    status,
    verified,
    canClaimCompleted: verified,
    canMentionAttempted: Boolean(result && action.kind !== 'none'),
    summary: verified
      ? `Verified action success: ${action.kind}.`
      : `Action not verified as completed: ${action.kind}.`,
    userVisibleMessage: userMessageForStatus(status, action, result),
    problems,
    requiredInstruction: instructionForStatus(status),
  };
}

export function buildActionVerificationPrompt(verification: ActionVerification) {
  return [
    'Action verification:',
    `- Action: ${verification.kind}`,
    `- Status: ${verification.status}`,
    `- Verified: ${verification.verified ? 'yes' : 'no'}`,
    `- Can claim completed: ${verification.canClaimCompleted ? 'yes' : 'no'}`,
    `- User-visible message: ${verification.userVisibleMessage}`,
    verification.problems.length ? `- Problems: ${verification.problems.join(' | ')}` : '',
    '',
    'Required rule:',
    verification.requiredInstruction,
  ]
    .filter(Boolean)
    .join('\n');
}

export function canClaimActionCompleted(
  action: AgentAction,
  result?: AgentActionResult | null,
) {
  return verifyAgentActionResult(action, result).canClaimCompleted;
}

export function guardAgainstFalseActionClaim(
  answer: string,
  verification: ActionVerification,
) {
  const clean = toText(answer);

  if (!clean) return verification.userVisibleMessage;

  if (verification.canClaimCompleted) return clean;

  if (!hasCompletionClaim(clean)) return clean;

  return verification.userVisibleMessage;
}

export function buildSafeActionAnswer(
  verification: ActionVerification,
  successMessage?: string,
) {
  if (verification.canClaimCompleted) {
    return toText(successMessage) || verification.userVisibleMessage;
  }

  return verification.userVisibleMessage;
}
