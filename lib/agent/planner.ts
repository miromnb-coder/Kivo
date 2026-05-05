import type { AgentIntent, AgentPlan, AgentStep, AgentToolName } from './types';

type PlanProfile = {
  complexity: 'low' | 'medium' | 'high';
  needsMemory: boolean;
  needsTools: boolean;
  needsVerification: boolean;
  toolHints: AgentToolName[];
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

function hasAny(text: string, signals: string[]) {
  return signals.some((signal) => text.includes(signal));
}

function step(
  id: string,
  title: string,
  detail: string,
  kind: AgentStep['kind'] = 'think',
): AgentStep {
  return {
    id,
    title,
    label: title,
    detail,
    status: 'pending',
    kind,
  };
}

function estimateComplexity(message: string): PlanProfile['complexity'] {
  const text = normalizeText(message);
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount > 80) return 'high';
  if (wordCount > 28) return 'medium';

  if (
    hasAny(text, [
      'full',
      'complete',
      'production',
      'replace',
      'refactor',
      'debug',
      'architecture',
      'strategy',
      'roadmap',
      'integration',
      'database',
      'oauth',
      'agent',
    ])
  ) {
    return 'high';
  }

  if (
    hasAny(text, [
      'plan',
      'compare',
      'analyze',
      'research',
      'build',
      'fix',
      'implement',
      'design',
    ])
  ) {
    return 'medium';
  }

  return 'low';
}

function detectToolHints(message: string, intent: AgentIntent): AgentToolName[] {
  const text = normalizeText(message);
  const tools = new Set<AgentToolName>();

  if (
    intent === 'memory' ||
    hasAny(text, ['memory', 'remember', 'forget', 'profile', 'preference'])
  ) {
    tools.add('memory');
  }

  if (
    intent === 'email' ||
    hasAny(text, ['email', 'mail', 'gmail', 'inbox', 'message', 'unread'])
  ) {
    tools.add('gmail');
  }

  if (
    intent === 'email' ||
    hasAny(text, ['outlook', 'microsoft mail', 'microsoft email'])
  ) {
    tools.add('outlook');
  }

  if (
    intent === 'calendar' ||
    hasAny(text, ['calendar', 'schedule', 'meeting', 'event', 'availability', 'free time'])
  ) {
    tools.add('google_calendar');
  }

  if (
    intent === 'research' ||
    hasAny(text, ['latest', 'current', 'search', 'find online', 'source', 'news', 'price'])
  ) {
    tools.add('web_search');
  }

  if (
    intent === 'finance' ||
    hasAny(text, ['money', 'budget', 'subscription', 'invoice', 'payment', 'receipt'])
  ) {
    tools.add('finance');
  }

  if (
    intent === 'project' ||
    hasAny(text, ['github', 'repo', 'repository', 'vercel', 'supabase', 'next.js', 'typescript'])
  ) {
    tools.add('browser');
  }

  return Array.from(tools);
}

function needsVerifiedAction(message: string, intent: AgentIntent) {
  const text = normalizeText(message);

  if (intent === 'personal_operator' || intent === 'calendar' || intent === 'email') {
    return hasAny(text, [
      'create',
      'add',
      'send',
      'delete',
      'rename',
      'update',
      'connect',
      'disconnect',
      'schedule',
      'book',
      'save',
    ]);
  }

  return false;
}

function analyzePlanProfile(intent: AgentIntent, message: string): PlanProfile {
  const complexity = estimateComplexity(message);
  const toolHints = detectToolHints(message, intent);

  const needsMemory =
    intent !== 'chat' ||
    complexity !== 'low' ||
    toolHints.includes('memory') ||
    toolHints.includes('gmail') ||
    toolHints.includes('outlook') ||
    toolHints.includes('google_calendar');

  const needsTools =
    toolHints.length > 0 ||
    intent === 'research' ||
    intent === 'finance' ||
    intent === 'calendar' ||
    intent === 'email' ||
    intent === 'personal_operator';

  return {
    complexity,
    needsMemory,
    needsTools,
    needsVerification: needsVerifiedAction(message, intent),
    toolHints,
  };
}

function baseSteps(profile: PlanProfile): AgentStep[] {
  const steps: AgentStep[] = [
    step(
      'understand-request',
      'Understand request',
      'Identify the user goal, expected output, and safest response path.',
      'think',
    ),
  ];

  if (profile.needsMemory) {
    steps.push(
      step(
        'read-memory',
        'Check relevant memory',
        'Use only relevant profile, preference, project, and recent context.',
        'memory',
      ),
    );
  }

  if (profile.needsTools) {
    steps.push(
      step(
        'select-tools',
        'Select tools',
        'Choose only the tools that are needed for this request.',
        'plan',
      ),
    );
  }

  return steps;
}

function stepsForIntent(intent: AgentIntent, profile: PlanProfile): AgentStep[] {
  const base = baseSteps(profile);

  switch (intent) {
    case 'plan':
      return [
        ...base,
        step('extract-priorities', 'Extract priorities', 'Find the most important goals, constraints, and next actions.', 'plan'),
        step('build-plan', 'Build plan', 'Create a clear plan with practical steps and order.', 'write'),
        step('final-check', 'Quality check', 'Make sure the plan is realistic, concise, and useful.', 'think'),
      ];

    case 'research':
      return [
        ...base,
        step('define-scope', 'Define research scope', 'Clarify what needs to be compared, verified, or sourced.', 'plan'),
        step('gather-current-info', 'Gather current information', 'Use current sources when the answer depends on recent data.', 'search'),
        step('synthesize-findings', 'Synthesize findings', 'Turn findings into a clear answer with tradeoffs and next steps.', 'write'),
      ];

    case 'finance':
      return [
        ...base,
        step('scan-finance-signals', 'Scan finance signals', 'Look for subscriptions, payments, renewals, bills, and money leaks.', 'finance'),
        step('risk-check', 'Check risk and confidence', 'Avoid guessing amounts or transactions without connected data.', 'think'),
        step('recommend-actions', 'Recommend actions', 'Prioritize concrete, safe financial next steps.', 'write'),
      ];

    case 'personal_operator':
      return [
        ...base,
        step('map-action', 'Map requested action', 'Identify what action the user wants completed.', 'tool'),
        step('execute-if-safe', 'Execute only if safe', 'Run the required tool only when enough information is available.', 'tool'),
        step('verify-action', 'Verify action result', 'Confirm completion only if the tool returns success.', 'done'),
      ];

    case 'calendar':
      return [
        ...base,
        step('read-calendar-context', 'Read calendar context', 'Check schedule, events, availability, or requested calendar action.', 'calendar'),
        step('prepare-calendar-response', 'Prepare calendar response', 'Separate confirmed calendar facts from suggestions.', 'write'),
        ...(profile.needsVerification
          ? [step('verify-calendar-action', 'Verify calendar action', 'Only claim completion after a successful calendar tool result.', 'done')]
          : []),
      ];

    case 'email':
      return [
        ...base,
        step('read-email-context', 'Read email context', 'Check Gmail or Outlook only when relevant and connected.', 'email'),
        step('classify-email-signals', 'Classify email signals', 'Identify important messages, bills, reminders, and low-priority items.', 'think'),
        step('prepare-email-summary', 'Prepare email summary', 'Summarize only verified email context.', 'write'),
      ];

    case 'memory':
      return [
        ...base,
        step('review-memory', 'Review memory', 'Identify useful, outdated, duplicate, or unsafe memory items.', 'memory'),
        step('apply-memory-policy', 'Apply memory policy', 'Keep only stable user, project, preference, routine, and goal information.', 'think'),
        step('prepare-memory-answer', 'Prepare memory answer', 'Explain memory clearly without exposing internal details.', 'write'),
      ];

    case 'project':
      return [
        ...base,
        step('inspect-project-context', 'Inspect project context', 'Understand files, features, bugs, and current implementation state.', 'read'),
        step('choose-safe-change', 'Choose safe change', 'Prefer the smallest complete change that improves the product.', 'plan'),
        step('produce-implementation', 'Produce implementation', 'Give exact code, file paths, or next steps.', 'write'),
        step('check-build-risk', 'Check build risk', 'Avoid type errors, broken imports, and unrelated changes.', 'think'),
      ];

    case 'settings':
      return [
        ...base,
        step('identify-setting', 'Identify setting', 'Understand which setting or preference should change.', 'think'),
        step('apply-setting-safely', 'Apply setting safely', 'Only change settings when the user clearly requested it.', 'tool'),
        step('confirm-setting', 'Confirm setting', 'Summarize what changed or what still needs user confirmation.', 'write'),
      ];

    case 'chat':
    default:
      if (profile.complexity === 'low') {
        return [
          step('understand-request', 'Understand request', 'Answer directly and avoid unnecessary steps.', 'think'),
          step('answer', 'Prepare answer', 'Give a clear, concise response.', 'write'),
        ];
      }

      return [
        ...base,
        step('structure-answer', 'Structure answer', 'Choose the clearest format for the response.', 'plan'),
        step('answer', 'Prepare answer', 'Write the final response clearly and usefully.', 'write'),
      ];
  }
}

function buildSummary(intent: AgentIntent, profile: PlanProfile) {
  const toolText = profile.toolHints.length
    ? ` with ${profile.toolHints.join(', ')} context`
    : '';

  switch (intent) {
    case 'plan':
      return `Kivo is building a practical plan${toolText}.`;
    case 'research':
      return `Kivo is researching and synthesizing the request${toolText}.`;
    case 'finance':
      return `Kivo is checking finance-related signals and safe next actions${toolText}.`;
    case 'personal_operator':
      return `Kivo is preparing an operator action and will verify completion before claiming success.`;
    case 'calendar':
      return `Kivo is handling calendar context or a calendar action${toolText}.`;
    case 'email':
      return `Kivo is checking email context and extracting useful signals${toolText}.`;
    case 'memory':
      return `Kivo is using memory safely and only when relevant.`;
    case 'project':
      return `Kivo is handling project implementation context${toolText}.`;
    case 'settings':
      return `Kivo is handling a settings or preference request.`;
    case 'chat':
    default:
      return profile.complexity === 'low'
        ? 'Kivo is answering directly.'
        : `Kivo is preparing a structured answer${toolText}.`;
  }
}

function confidenceForPlan(profile: PlanProfile) {
  let confidence = 0.76;

  if (profile.complexity === 'low') confidence += 0.08;
  if (profile.complexity === 'high') confidence -= 0.08;
  if (profile.needsVerification) confidence -= 0.04;
  if (profile.toolHints.length > 0) confidence += 0.03;

  return Math.max(0.45, Math.min(0.95, Number(confidence.toFixed(2))));
}

export function createPlan(intent: AgentPlan['intent'], message: string): AgentPlan {
  const profile = analyzePlanProfile(intent, message);
  const steps = stepsForIntent(intent, profile);

  return {
    intent,
    summary: buildSummary(intent, profile),
    needsTools: profile.needsTools,
    steps,
    confidence: confidenceForPlan(profile),
    requiredTools: profile.toolHints.length ? profile.toolHints : undefined,
  };
}
