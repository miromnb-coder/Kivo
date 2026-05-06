export type VerifiedToolAction = {
  action: string;
  success: boolean;
  label?: string;
  error?: string;
};

export type VerifyAnswerOptions = {
  minLength?: number;
  maxLength?: number;
  fallbackMessage?: string;
  requiredActions?: string[];
  toolActions?: VerifiedToolAction[];
};

const DEFAULT_FALLBACK =
  'Something went wrong. Please try again.';

const UNVERIFIED_ACTION_FALLBACK =
  'I could not verify that the requested action was completed. Please try again or reconnect the required tool.';

function toCleanText(value: unknown) {
  return typeof value === 'string'
    ? value.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    : '';
}

function uniqueLines(answer: string) {
  const lines = answer.split('\n');
  const seen = new Set<string>();
  const output: string[] = [];

  for (const line of lines) {
    const key = line.trim().toLowerCase();

    if (key && seen.has(key)) continue;
    if (key) seen.add(key);

    output.push(line);
  }

  return output.join('\n').trim();
}

function hasRequiredActionSuccess(
  requiredAction: string,
  toolActions: VerifiedToolAction[] = [],
) {
  return toolActions.some(
    (toolAction) =>
      toolAction.success &&
      toolAction.action === requiredAction,
  );
}

function hasFailedRequiredAction(
  requiredActions: string[] = [],
  toolActions: VerifiedToolAction[] = [],
) {
  if (!requiredActions.length) return false;

  return requiredActions.some(
    (requiredAction) =>
      !hasRequiredActionSuccess(requiredAction, toolActions),
  );
}

function truncateSafely(answer: string, maxLength: number) {
  if (answer.length <= maxLength) return answer;

  const sliced = answer.slice(0, maxLength);
  const lastSentence = Math.max(
    sliced.lastIndexOf('.'),
    sliced.lastIndexOf('!'),
    sliced.lastIndexOf('?'),
    sliced.lastIndexOf('\n'),
  );

  if (lastSentence > Math.floor(maxLength * 0.6)) {
    return sliced.slice(0, lastSentence + 1).trim();
  }

  return `${sliced.trim()}…`;
}

export function verifyAnswer(
  answer: string,
  options: VerifyAnswerOptions = {},
): string {
  const minLength = options.minLength ?? 5;
  const maxLength = options.maxLength ?? 12_000;
  const fallbackMessage = options.fallbackMessage ?? DEFAULT_FALLBACK;

  let clean = toCleanText(answer);

  if (!clean || clean.length < minLength) {
    return fallbackMessage;
  }

  clean = uniqueLines(clean);

  if (hasFailedRequiredAction(options.requiredActions, options.toolActions)) {
    return UNVERIFIED_ACTION_FALLBACK;
  }

  if (clean.length > maxLength) {
    clean = truncateSafely(clean, maxLength);
  }

  return clean || fallbackMessage;
}
