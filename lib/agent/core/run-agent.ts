import { runKivoModel } from '@/lib/ai/model-router';
import { routeAgentAction } from '../actions/action-router';
import { executeAgentAction, actionResultForPrompt } from '../actions/action-executor';
import {
  buildActionVerificationPrompt,
  guardAgainstFalseActionClaim,
  verifyAgentActionResult,
} from '../actions/action-verifier';
import { EMPTY_AGENT_ACTION, type AgentAction, type AgentActionResult } from '../actions/action-types';
import { createPlan } from './planner';
import { routeIntent } from './router';
import { getMemoryContext, saveAgentRun, saveMemory } from '../memory/memory';
import { buildMemoryBrief, shouldUseMemory } from '../memory/memory-policy';
import { extractMemoryCandidates } from '../memory/memory-extraction';
import { formatCalendarTodayForPrompt, runCalendarTodayTool } from '../tools/calendar';
import { runGmailTool, shouldRunGmailTool, type GmailToolResult } from '../tools/gmail';
import {
  formatOutlookForPrompt,
  runOutlookTool,
  shouldRunOutlookTool,
  type OutlookToolResult,
} from '../tools/outlook';
import type { AgentAttachment, AgentRequest, AgentResult } from './types';

type ExecutionStep = {
  title: string;
  detail?: string;
  status: 'pending' | 'running' | 'done';
  kind?: 'search' | 'plan' | 'write' | 'tool' | 'think';
};

type ToolRouting = {
  needsClarification: boolean;
  useWebSearch: boolean;
  useCalendar: boolean;
  useGmail: boolean;
  useOutlook: boolean;
  reason?: string;
};

type ImageModelAttachment = {
  url?: string;
  base64?: string;
  mimeType?: string;
};

const KIVO_SYSTEM_PROMPT = [
  'You are Kivo AI, a premium personal AI operator.',
  '',
  'Core behavior:',
  '- Be useful, calm, direct, and high-quality.',
  '- Reply in the same language as the user unless the user asks otherwise.',
  '- Do not force any specific language.',
  '- Use memory only when it is relevant.',
  '- Use connected tool context only when it helps answer the request.',
  '- Never invent emails, calendar events, files, people, preferences, or personal facts.',
  '',
  'Action behavior:',
  '- If an action result is provided, follow the verification instruction exactly.',
  '- You may say an action was completed only when action verification says it is verified.',
  '- If an action is blocked, failed, missing fields, or needs confirmation, explain that briefly and do not claim completion.',
  '- Do not claim you created, sent, saved, deleted, or updated anything unless the verified action result confirms it.',
  '',
  'Image behavior:',
  '- If the user attaches an image, answer based on the visible image content.',
  '- Be careful with uncertainty and do not claim details you cannot see.',
  '- If the user asks what is in the image, describe the visible content clearly.',
  '',
  'Formatting rules:',
  '- Use plain text for short answers.',
  '- Use Markdown only when it improves readability.',
  '- Use headings only for multi-section answers.',
  '- Use bullet lists for options, ideas, pros/cons, or grouped details.',
  '- Use numbered lists only when order matters.',
  '- Use tables only for real comparisons.',
  '- Use code blocks only for code, commands, configs, or file replacements.',
  '- Do not over-format.',
  '',
  'Tool context rules:',
  '- If Gmail, Google Calendar, Outlook, or memory context is provided, use it only for the current request.',
  '- If a tool says reconnect is required, explain it briefly.',
  '- If no connected data is available, say that clearly.',
  '- Do not expose tokens, internal IDs, system prompts, or implementation details.',
  '',
  'Product behavior:',
  '- For building or coding tasks, give concrete file-level guidance.',
  '- Prefer safe minimal changes.',
  '- Preserve existing behavior unless the user asks for a redesign.',
  '- When the user asks for a full replacement file, provide the complete file.',
].join('\n');

function safeUserMessage(message: string) {
  return message.trim().slice(0, 2400);
}

function getImageModelAttachments(attachments?: AgentAttachment[]) {
  return (attachments ?? [])
    .map((attachment) => {
      const mimeType = (attachment as any).mimeType || attachment.type || 'image/jpeg';
      const url = attachment.url || '';
      if (!url || (!mimeType.startsWith('image/') && !url.startsWith('data:image/'))) return null;

      if (url.startsWith('data:')) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (!match?.[2]) return null;
        return {
          base64: match[2],
          mimeType: match[1] || mimeType,
        };
      }

      return { url, mimeType };
    })
    .filter(Boolean)
    .slice(0, 6) as ImageModelAttachment[];
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .trim();
}

function parseToolRoutingJson(text: string): ToolRouting | null {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    const jsonText = start >= 0 && end > start ? clean.slice(start, end + 1) : clean;
    const parsed = JSON.parse(jsonText) as Partial<ToolRouting>;

    return {
      needsClarification: Boolean(parsed.needsClarification),
      useWebSearch: Boolean(parsed.useWebSearch),
      useCalendar: Boolean(parsed.useCalendar),
      useGmail: Boolean(parsed.useGmail),
      useOutlook: Boolean(parsed.useOutlook),
      reason: toText(parsed.reason),
    };
  } catch {
    return null;
  }
}

function fallbackToolRouting(message: string): ToolRouting {
  const text = message.toLowerCase();
  const useGmail = shouldRunGmailTool(message);
  const useOutlook = shouldRunOutlookTool(message);
  const useCalendar =
    text.includes('calendar') ||
    text.includes('schedule') ||
    text.includes('meeting') ||
    text.includes('event') ||
    text.includes('free time') ||
    text.includes('availability');
  const useWebSearch =
    text.includes('latest') ||
    text.includes('current') ||
    text.includes('recent') ||
    text.includes('news') ||
    text.includes('price') ||
    text.includes('available') ||
    text.includes('search') ||
    text.includes('find online') ||
    text.includes('today');
  const needsClarification =
    text.split(/\s+/).filter(Boolean).length <= 4 &&
    (text.includes('plan') || text.includes('build') || text.includes('design'));

  return { needsClarification, useWebSearch, useCalendar, useGmail, useOutlook, reason: 'fallback-routing' };
}

async function classifyToolRouting(req: AgentRequest): Promise<ToolRouting> {
  const safeMessage = safeUserMessage(req.message);

  try {
    const result = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 220,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: [
            'Classify what tools a personal AI assistant should use.',
            'Return strict JSON only. No markdown. No explanation.',
            'Fields: needsClarification, useWebSearch, useCalendar, useGmail, useOutlook, reason.',
            'UseWebSearch is for current/live/price/availability/news/online lookup requests.',
            'UseCalendar is for schedule/day planning/meetings/events/free time.',
            'UseGmail is for Gmail or email requests.',
            'UseOutlook is for Outlook/Microsoft Mail/Microsoft Calendar requests.',
            '{"needsClarification":false,"useWebSearch":false,"useCalendar":false,"useGmail":false,"useOutlook":false,"reason":"..."}',
          ].join('\n'),
        },
        { role: 'user', content: safeMessage },
      ],
    });

    return parseToolRoutingJson(result.content) ?? fallbackToolRouting(req.message);
  } catch {
    return fallbackToolRouting(req.message);
  }
}

function shouldShowExecutionSteps(message: string, routing: ToolRouting) {
  const text = message.trim();
  if (!text) return false;
  if (text.length < 18 && !routing.useCalendar && !routing.useGmail && !routing.useOutlook && !routing.useWebSearch) {
    return false;
  }
  return routing.useCalendar || routing.useGmail || routing.useOutlook || routing.useWebSearch || text.length > 80;
}

function actionStep(action: AgentAction, result?: AgentActionResult | null): ExecutionStep | null {
  if (action.kind === 'none') return null;

  return {
    title: action.userVisibleLabel || 'Run action',
    detail: result?.userVisibleMessage || result?.message || action.reason,
    status: 'done',
    kind: 'tool',
  };
}

function buildExecutionSteps(
  message: string,
  routing: ToolRouting,
  options?: {
    calendarConnected?: boolean;
    gmailConnected?: boolean;
    outlookConnected?: boolean;
    fallback?: boolean;
    hasImages?: boolean;
    action?: AgentAction;
    actionResult?: AgentActionResult | null;
  },
): ExecutionStep[] {
  if (routing.needsClarification) {
    return [
      {
        title: 'Clarifying request',
        detail: 'Kivo asks only for the details needed to produce a better result.',
        status: 'done',
        kind: 'think',
      },
    ];
  }

  if (!shouldShowExecutionSteps(message, routing) && !options?.hasImages && options?.action?.kind === 'none') return [];

  const steps: ExecutionStep[] = [
    {
      title: 'Understanding request',
      detail: options?.hasImages
        ? 'Kivo reads your message and attached image.'
        : 'Kivo identifies the goal and chooses the right context.',
      status: 'done',
      kind: 'think',
    },
  ];

  if (options?.hasImages) {
    steps.push({
      title: 'Reading image',
      detail: 'Kivo analyzes the visible content in the attached image.',
      status: 'done',
      kind: 'tool',
    });
  }

  if (routing.useGmail) {
    steps.push({
      title: options?.gmailConnected ? 'Reading Gmail context' : 'Checking Gmail connection',
      detail: options?.gmailConnected
        ? 'Kivo reviews relevant email signals, bills, and action items.'
        : 'Gmail context was requested but may not be connected.',
      status: 'done',
      kind: 'tool',
    });
  }

  if (routing.useOutlook) {
    steps.push({
      title: options?.outlookConnected ? 'Reading Outlook Smart context' : 'Checking Outlook connection',
      detail: options?.outlookConnected
        ? 'Kivo reviews Outlook emails, calendar events, and priority signals.'
        : 'Outlook context was requested but may not be connected.',
      status: 'done',
      kind: 'tool',
    });
  }

  if (routing.useCalendar) {
    steps.push({
      title: options?.calendarConnected ? 'Reading calendar context' : 'Checking calendar connection',
      detail: options?.calendarConnected
        ? 'Kivo reviews schedule context and upcoming events.'
        : 'Calendar context was requested but may not be connected.',
      status: 'done',
      kind: 'tool',
    });
  }

  const actionExecutionStep = options?.action ? actionStep(options.action, options.actionResult) : null;
  if (actionExecutionStep) steps.push(actionExecutionStep);

  if (routing.useWebSearch) {
    steps.push({
      title: options?.fallback ? 'Web search unavailable' : 'Checking current information',
      detail: options?.fallback
        ? 'Kivo continues safely without pretending to have live sources.'
        : 'Kivo uses current information when needed.',
      status: 'done',
      kind: 'search',
    });
  }

  steps.push({
    title: 'Building response',
    detail: 'Kivo turns the available context into a clear answer.',
    status: 'done',
    kind: 'plan',
  });

  return steps.slice(0, 7);
}

async function buildClarifyingAnswer(req: AgentRequest, memoryBrief?: string) {
  try {
    const response = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 260,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: [
            KIVO_SYSTEM_PROMPT,
            memoryBrief ? `\n${memoryBrief}` : '',
            'The user request is missing important details. Ask 1-3 specific clarifying questions. Use the same language as the user.',
          ].join('\n'),
        },
        { role: 'user', content: safeUserMessage(req.message) },
      ],
    });
    return response.content.trim();
  } catch {
    return 'Please clarify one detail so I can answer this properly.';
  }
}

function shouldCreateDocumentCard(message: string, answer: string) {
  if (!answer || answer.length < 700) return false;
  const messageText = message.toLowerCase();
  const taskSignals = ['plan', 'write', 'create', 'build', 'roadmap', 'schedule', 'guide', 'report', 'document', 'strategy'];
  const hasTaskSignal = taskSignals.some((signal) => messageText.includes(signal));
  const isStructured = /(^|\n)#{1,3}\s+/.test(answer) || /(^|\n)\d+[.)]\s+/.test(answer) || /(^|\n)[-*•]\s+/.test(answer);
  return hasTaskSignal && isStructured;
}

function buildDocumentCard(answer: string) {
  const lines = answer.split('\n').map((line) => line.trim()).filter(Boolean);
  const titleLine = lines.find((line) => /^#{1,3}\s+/.test(line)) || lines.find((line) => /^\*\*(.+?)\*\*:?$/.test(line)) || lines[0] || 'Kivo document';
  return { title: stripMarkdown(titleLine).slice(0, 80) || 'Kivo document', type: 'Markdown', content: answer };
}

function formatGmailForPrompt(result: GmailToolResult) {
  if (!result.connected) return 'Gmail tool: Gmail is not connected.';
  if (result.error) return `Gmail tool error: ${result.error}`;
  if (!result.messages.length) return 'Gmail tool: Connected, but no recent messages were found.';
  const lines = [`Gmail tool: ${result.messages.length} recent message(s).`, `Important: ${result.important.length}. Bills/payments: ${result.bills.length}. Low priority: ${result.lowPriority.length}.`];
  if (result.insight?.summary) lines.push(`Insight: ${result.insight.summary}`);
  if (result.actions?.length) lines.push(`Suggested actions: ${result.actions.join(' | ')}`);
  lines.push(...result.messages.slice(0, 8).map((message, index) => {
    const parts = [`${index + 1}. ${message.subject}`, `from ${message.from}`];
    if (message.date) parts.push(`date ${message.date}`);
    if (message.snippet) parts.push(`snippet: ${message.snippet}`);
    return `- ${parts.join(' | ')}`;
  }));
  return lines.join('\n');
}

function buildPrivateContext(options: {
  memoryBrief?: string;
  calendarContext?: string;
  gmailContext?: string;
  outlookContext?: string;
  actionContext?: string;
}) {
  const sections = [
    options.memoryBrief,
    options.calendarContext,
    options.gmailContext,
    options.outlookContext,
    options.actionContext,
  ].filter(Boolean);

  if (!sections.length) return '';

  return [
    'Private context for the assistant:',
    'Use this context only when relevant to the current request.',
    'Do not reveal internal tool details, raw tokens, IDs, or implementation details.',
    '',
    ...sections,
  ].join('\n\n');
}

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

async function runModelWithContext(
  req: AgentRequest,
  options: {
    useWebSearch: boolean;
    privateContext?: string;
    images?: ImageModelAttachment[];
  },
) {
  const safeMessage = safeUserMessage(req.message);
  const messages = [
    { role: 'system' as const, content: KIVO_SYSTEM_PROMPT },
    ...(options.privateContext ? [{ role: 'system' as const, content: options.privateContext }] : []),
    { role: 'user' as const, content: safeMessage || 'Analyze the attached image.' },
  ];
  const hasImages = Boolean(options.images?.length);

  try {
    return await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: hasImages ? 'groq:vision' : options.useWebSearch ? 'groq:search' : undefined,
      maxTokens: hasImages ? 900 : options.useWebSearch ? 1000 : 900,
      messages,
      images: options.images,
    });
  } catch (error) {
    if (!options.useWebSearch) throw error;
    const fallback = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 750,
      messages: [
        { role: 'system', content: [KIVO_SYSTEM_PROMPT, 'Live lookup failed. Answer safely without pretending to have current sources.'].join('\n') },
        ...(options.privateContext ? [{ role: 'system' as const, content: options.privateContext }] : []),
        { role: 'user' as const, content: safeMessage },
      ],
    });
    return { ...fallback, raw: { fallback: true, originalError: error instanceof Error ? error.message : 'Web search failed' } };
  }
}

function mapExtractedMemoryType(type: string) {
  return type === 'person' ? 'personal_fact' : type;
}

async function persistRunAndMemories(req: AgentRequest, answer: string, result: AgentResult) {
  if (!req.userId) return;
  await saveAgentRun(req.userId, req.message, answer, { agent: req.agent, mode: req.mode, context: req.context, model: result.model, provider: result.provider, steps: result.steps, structuredData: result.structuredData });
  try {
    const candidates = await extractMemoryCandidates(req.message, answer);
    await Promise.allSettled(candidates.map((candidate) => saveMemory(req.userId!, candidate.content, mapExtractedMemoryType(candidate.type), candidate.importance)));
  } catch {}
}

function hasConfirmedAction(req: AgentRequest, action: AgentAction) {
  const metadata = req.metadata ?? {};
  const confirmed = metadata.confirmed === true || metadata.confirmedAction === true;
  const confirmedActionId = toText(metadata.confirmedActionId);
  const confirmedActionKind = toText(metadata.confirmedActionKind);

  return Boolean(
    confirmed ||
      (confirmedActionId && confirmedActionId === action.id) ||
      (confirmedActionKind && confirmedActionKind === action.kind),
  );
}

function shouldExecuteAction(action: AgentAction) {
  return action.kind !== 'none' && action.status !== 'unsafe' && action.status !== 'blocked';
}

function shouldUseActionToolContext(action: AgentAction) {
  return action.kind === 'gmail.scan' || action.kind === 'outlook.scan' || action.kind === 'calendar.read_today';
}

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);
  const imageAttachments = getImageModelAttachments(req.attachments);
  const hasImages = imageAttachments.length > 0;
  const routing = hasImages
    ? { needsClarification: false, useWebSearch: false, useCalendar: false, useGmail: false, useOutlook: false, reason: 'image-attachment' }
    : await classifyToolRouting(req);

  const action = hasImages ? EMPTY_AGENT_ACTION : await routeAgentAction(req);
  const actionResult = shouldExecuteAction(action)
    ? await executeAgentAction(action, {
        userId: req.userId,
        timezone: req.timezone,
        locale: req.locale,
        conversationId: req.conversationId,
      }, {
        confirmed: hasConfirmedAction(req, action),
      })
    : null;
  const actionVerification = verifyAgentActionResult(action, actionResult);

  const memory = await getMemoryContext(req.userId, req.message, {
    conversationId: req.conversationId,
    includeConversationContext: Boolean(req.conversationId),
    includeConversationSummary: true,
    recentMessageLimit: 16,
    finalMemoryLimit: 14,
  });
  const memoryBrief = shouldUseMemory(memory) ? buildMemoryBrief(memory, intent) : '';

  if (routing.needsClarification && action.kind === 'none') {
    const answer = await buildClarifyingAnswer(req, memoryBrief);
    const steps = buildExecutionSteps(req.message, routing, { hasImages, action, actionResult });
    return withStructuredData({ answer, steps, intent }, { clarification: { required: true, reason: routing.reason || 'Missing context.' }, memory: shouldUseMemory(memory) ? { used: true } : { used: false }, action, actionResult, actionVerification });
  }

  const actionProvidesGmailContext = action.kind === 'gmail.scan' && actionResult?.success;
  const actionProvidesOutlookContext = action.kind === 'outlook.scan' && actionResult?.success;
  const actionProvidesCalendarContext = action.kind === 'calendar.read_today' && actionResult?.success;

  const emptyGmail: GmailToolResult = { connected: false, messages: [], important: [], bills: [], lowPriority: [], actions: [] };
  const emptyOutlook: OutlookToolResult = { connected: false, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: [] };
  const [calendar, gmail, outlook] = await Promise.all([
    routing.useCalendar && !actionProvidesCalendarContext
      ? runCalendarTodayTool(req.userId)
      : Promise.resolve({ connected: false, events: [] }),
    routing.useGmail && !actionProvidesGmailContext
      ? runGmailTool(req.userId)
      : Promise.resolve(emptyGmail),
    routing.useOutlook && !actionProvidesOutlookContext
      ? runOutlookTool(req.userId)
      : Promise.resolve(emptyOutlook),
  ]);

  const actionContext = action.kind !== 'none'
    ? [
        actionResultForPrompt(actionResult),
        buildActionVerificationPrompt(actionVerification),
      ].join('\n\n')
    : '';

  const privateContext = buildPrivateContext({
    memoryBrief,
    calendarContext: routing.useCalendar ? formatCalendarTodayForPrompt(calendar) : '',
    gmailContext: routing.useGmail ? formatGmailForPrompt(gmail) : '',
    outlookContext: routing.useOutlook ? formatOutlookForPrompt(outlook) : '',
    actionContext,
  });

  const forceNoWebSearch = action.kind !== 'none' && !actionVerification.canClaimCompleted && actionVerification.status !== 'not_applicable';
  const response = await runModelWithContext(req, {
    useWebSearch: forceNoWebSearch ? false : routing.useWebSearch,
    privateContext,
    images: imageAttachments,
  });
  const fallbackUsed = Boolean((response.raw as any)?.fallback);
  const sources = response.sources ?? [];
  const sourceText = sources.length ? ['', '### Sources', ...sources.slice(0, 3).map((source, index) => `${index + 1}. ${source.title ?? 'Source'}${source.url ? ` — ${source.url}` : ''}`)].join('\n') : '';
  const rawAnswer = response.content + sourceText;
  const answer = action.kind !== 'none'
    ? guardAgainstFalseActionClaim(rawAnswer, actionVerification)
    : rawAnswer;
  const documentCard = shouldCreateDocumentCard(req.message, answer) ? buildDocumentCard(answer) : null;
  const steps = buildExecutionSteps(req.message, routing, { calendarConnected: Boolean((calendar as any)?.connected || actionProvidesCalendarContext), gmailConnected: Boolean((gmail as any)?.connected || actionProvidesGmailContext), outlookConnected: Boolean((outlook as any)?.connected || actionProvidesOutlookContext), fallback: fallbackUsed, hasImages, action, actionResult }) || [];

  const finalResult = withStructuredData(
    { answer, steps: steps.length ? steps : plan.steps.map((step) => ({ ...step, status: 'done' })), intent, model: response.model, provider: response.provider },
    {
      memory: shouldUseMemory(memory) ? { used: true, hasProfile: Boolean(memory.profileSummary), memories: memory.preferences?.length ?? 0, recentContext: memory.recentContext?.length ?? 0 } : { used: false },
      gmail: routing.useGmail ? gmail : null,
      calendar: routing.useCalendar ? calendar : null,
      outlook: routing.useOutlook ? outlook : null,
      action,
      actionResult,
      actionVerification,
      actions: action.kind !== 'none'
        ? [
            {
              action: action.kind,
              success: actionVerification.canClaimCompleted,
              tool: action.tool === 'none' ? undefined : action.tool,
              label: action.userVisibleLabel,
              error: actionVerification.problems[0],
              metadata: {
                status: actionVerification.status,
                verified: actionVerification.verified,
              },
            },
          ]
        : [],
      documentCard,
      sources,
      imageAttachments: hasImages ? { used: true, count: imageAttachments.length } : { used: false },
      webSearch: routing.useWebSearch ? { used: !fallbackUsed && !forceNoWebSearch, fallback: fallbackUsed } : { used: false },
      routing,
      actionToolContext: shouldUseActionToolContext(action),
    },
  );

  await persistRunAndMemories(req, answer, finalResult);
  return finalResult;
}
