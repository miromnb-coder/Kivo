import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { formatCalendarTodayForPrompt, runCalendarTodayTool } from './tools/calendar';
import { runGmailTool, shouldRunGmailTool, type GmailToolResult } from './tools/gmail';
import { formatOutlookForPrompt, runOutlookTool, shouldRunOutlookTool, type OutlookToolResult } from './tools/outlook';
import { routeIntent } from './router';
import type { AgentRequest, AgentResult } from './types';

type ExecutionStep = {
  title: string;
  detail?: string;
  status: 'pending' | 'running' | 'done';
  kind?: 'search' | 'plan' | 'write' | 'tool' | 'think';
};

const KIVO_SYSTEM_PROMPT = [
  'You are Kivo AI, a premium personal AI operator.',
  '',
  'Your answers must feel clear, useful, calm, and high-end.',
  '',
  'Formatting rules:',
  '- Use clean Markdown when it improves readability.',
  '- Use ## for main sections.',
  '- Use ### for smaller sections.',
  '- Use **bold** for important words, decisions, names, dates, times, priorities, warnings, and next actions.',
  '- Use - bullet lists for quick details.',
  '- Use numbered lists for step-by-step instructions.',
  '- Use tables when comparing options, prices, features, pros/cons, schedules, or structured data.',
  '- Use code blocks with language tags for code, for example ```tsx or ```ts.',
  '- Use inline code for filenames, commands, variables, routes, and short code terms.',
  '- Use links when relevant, using Markdown format: [Title](https://example.com).',
  '- Use quotes only for important notes or highlighted warnings.',
  '',
  'Format decision rules:',
  '- Use plain text for short, direct answers.',
  '- Use bullet lists when giving quick options, features, pros/cons, or small groups of ideas.',
  '- Use numbered lists only when order matters or the user needs step-by-step instructions.',
  '- Use tables only when comparing 2 or more items across the same criteria, such as price, features, pros/cons, schedules, or tools.',
  '- Use code blocks only for real code, commands, config, or file replacements.',
  '- Use inline code for filenames, routes, variables, commands, package names, and short technical terms.',
  '- Use quotes only for important warnings, notes, or takeaways.',
  '- Use headings only when the answer has multiple sections.',
  '- Do not use a table for simple answers.',
  '- Do not use a heading for a one-sentence answer.',
  '- Do not over-format.',
  '',
  'Adaptive response rules:',
  '- Adapt the answer depth to the user’s message.',
  '- If the user asks a short/simple question, answer shortly.',
  '- If the user asks for planning, design, strategy, or building, give a structured answer.',
  '- If the user asks technical implementation questions, be precise and include filenames, code blocks, and steps when useful.',
  '- If the user asks for code changes, be careful, safe, and avoid changing unrelated parts.',
  '- Prefer the smallest safe change that improves the product.',
  '',
  'Private tool context rules:',
  '- If Gmail, Google Calendar, or Outlook context is provided, use it only to answer the user’s request.',
  '- Do not say email or calendar is unavailable when connected context is provided.',
  '- If a tool context says reconnect is needed or there is an error, explain that clearly and briefly.',
  '- Do not invent emails, senders, calendar events, times, or counts that are not in the tool context.',
  '- When both email and calendar context exist, combine them intelligently into priorities and next actions.',
  '',
  'Language:',
  '- Reply in the same language as the user unless they ask otherwise.',
  '- If the user writes Finnish, reply in Finnish.',
  '- Keep technical code and filenames exactly as written.',
].join('\n');

function safeUserMessage(message: string) {
  return message.trim().slice(0, 1800);
}

function shouldUseWebSearch(message: string) {
  const text = message.toLowerCase().trim();
  if (!text) return false;
  const currentSignals = ['uusin', 'latest', 'tänään', 'today', 'nyt', 'now', 'current', 'ajankohtainen', 'news', 'uutiset', 'hinta', 'price', 'halvin', 'cheapest', 'saatavilla', 'available', 'osto', 'buy', 'kauppa', 'store', 'auki', 'open now', 'ravintola', 'restaurant', 'kahvila', 'cafe', 'hotelli', 'hotel', 'tapahtuma', 'event', 'near me', 'lähellä', 'weather', 'sää'];
  const researchSignals = ['etsi', 'hae', 'selvitä', 'research', 'find', 'search', 'compare', 'vertaa'];
  return currentSignals.some((word) => text.includes(word)) || researchSignals.some((word) => text.includes(word));
}

function detectSearchCountry(message: string) {
  const text = message.toLowerCase();
  const pairs: Array<[string, string]> = [
    ['jyväskylä', 'finland'], ['kuopio', 'finland'], ['helsinki', 'finland'], ['suomi', 'finland'], ['finland', 'finland'],
    ['tokyo', 'japan'], ['osaka', 'japan'], ['japan', 'japan'],
    ['new york', 'united states'], ['san francisco', 'united states'], ['usa', 'united states'],
    ['london', 'united kingdom'], ['paris', 'france'], ['berlin', 'germany'], ['stockholm', 'sweden'],
  ];
  return pairs.find(([key]) => text.includes(key))?.[1];
}

function isClearlyExecutableRequest(text: string) {
  const executableSignals = ['taulukko', 'table', 'lista', 'list', 'vertaa', 'compare', 'yhteenveto', 'summary', 'esimerkki', 'example', 'koodi', 'code', 'selitä', 'explain', 'kerro', 'tell', 'anna', 'give'];
  return executableSignals.some((word) => text.includes(word));
}

function shouldAskClarifyingQuestion(message: string) {
  const text = message.toLowerCase().trim();
  if (!text) return false;
  if (isClearlyExecutableRequest(text)) return false;
  if (text.includes('tänään') || text.includes('today') || text.includes('gmail') || text.includes('outlook') || text.includes('sähköposti') || text.includes('kalenteri')) return false;

  const complex = ['suunnittele', 'rakenna', 'roadmap', 'plan', 'build', 'strategia', 'strategy'].some((word) => text.includes(word));
  if (!complex) return false;

  const hasEnoughContext = ['budjetti', 'budget', 'aika', 'time', 'kaupunki', 'city', 'tavoite', 'goal', 'tyyli', 'style', 'deadline'].some((word) => text.includes(word));
  const veryShort = text.split(/\s+/).length < 7;
  const vague = ['jotain', 'jonkun', 'hyvä', 'parempi', 'paras', 'tämmöinen', 'tällainen'].some((word) => text.includes(word));

  return !hasEnoughContext && (veryShort || vague);
}

async function buildClarifyingAnswer(req: AgentRequest) {
  const safeMessage = safeUserMessage(req.message);
  const clarificationPrompt = [
    KIVO_SYSTEM_PROMPT,
    '',
    'You are not answering the task yet. Ask 1-3 specific clarifying questions tailored to the user’s exact request.',
    'Do not use a generic template. Use the same language as the user.',
  ].join('\n');

  try {
    const response = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 260,
      messages: [{ role: 'system', content: clarificationPrompt }, { role: 'user', content: safeMessage }],
    });
    return response.content.trim();
  } catch {
    return 'Tarkennan yhden asian: haluatko tästä yleisen version vai sinun omaan tilanteeseesi sopivan version?';
  }
}

function shouldShowExecutionSteps(message: string) {
  const text = message.toLowerCase().trim();
  if (!text || ['hei', 'moi', 'hello', 'hi', 'ok', 'kiitos'].includes(text)) return false;
  if (text.length < 18) return false;
  const complexWords = ['suunnittele', 'tee minulle', 'rakenna', 'analysoi', 'etsi', 'hae', 'selvitä', 'vertaa', 'kirjoita', 'roadmap', 'plan', 'analyze', 'research', 'build', 'create', 'write', 'compare', 'summary', 'yhteenveto', 'kalenteri', 'calendar', 'gmail', 'outlook', 'sähköposti', 'email', 'päivä', 'today', 'aikataulu', 'schedule', 'hinta', 'uutiset'];
  return complexWords.some((word) => text.includes(word));
}

function buildExecutionSteps(message: string, options?: { calendar?: boolean; gmail?: boolean; outlook?: boolean; today?: boolean; clarify?: boolean; webSearch?: boolean; fallback?: boolean }): ExecutionStep[] {
  if (options?.clarify) return [{ title: 'Tarkennetaan pyyntöä', detail: 'Kivo kysyy vain ne tiedot, joita juuri tähän tehtävään tarvitaan.', status: 'done', kind: 'think' }];
  if (!shouldShowExecutionSteps(message)) return [];
  const text = message.toLowerCase();
  const steps: ExecutionStep[] = [{ title: 'Ymmärretään pyyntö', detail: 'Kivo tunnistaa tavoitteen ja valitsee sopivan vastaustavan.', status: 'done', kind: 'think' }];
  if (options?.gmail || shouldRunGmailTool(message)) steps.push({ title: 'Tarkistetaan Gmail-konteksti', detail: 'Haetaan tärkeät viestit, laskut ja mahdolliset action itemit.', status: 'done', kind: 'tool' });
  if (options?.outlook || shouldRunOutlookTool(message)) steps.push({ title: 'Tarkistetaan Outlook Smart -konteksti', detail: 'Haetaan Outlookin viestit, kalenteri, laskut ja tärkeät signaalit.', status: 'done', kind: 'tool' });
  if (options?.calendar && (text.includes('kalenteri') || text.includes('calendar') || text.includes('päivä') || text.includes('today'))) steps.push({ title: 'Tarkistetaan Google Calendar', detail: 'Haetaan päivän tapahtumat ja vapaat aikaikkunat.', status: 'done', kind: 'tool' });
  if (options?.webSearch) steps.push({ title: options.fallback ? 'Web search ei onnistunut, jatketaan turvallisesti' : 'Etsitään ajankohtaista tietoa verkosta', detail: options.fallback ? 'Kivo antaa vastauksen ilman lähteitä, jotta keskustelu ei jää jumiin.' : 'Kivo käyttää web searchia tuoreisiin lähteisiin.', status: 'done', kind: 'search' });
  steps.push({ title: options?.today ? 'Rakennetaan päivän suunnitelma' : 'Rakennetaan vastaus', detail: 'Järjestetään tieto selkeäksi ja käyttökelpoiseksi kokonaisuudeksi.', status: 'done', kind: 'plan' });
  return steps.slice(0, 6);
}

function shouldCreateDocumentCard(message: string, answer: string) {
  const text = message.toLowerCase();
  if (!answer || answer.length < 700) return false;
  const triggers = ['suunnittele', 'plan', 'kirjoita', 'write', 'tee minulle', 'create', 'rakenna', 'build', 'roadmap', 'aikataulu', 'päivä', 'ohjelma', 'suunnitelma', 'opas', 'guide', 'raportti', 'report'];
  const hasTrigger = triggers.some((trigger) => text.includes(trigger));
  const isStructured = /(^|\n)#{1,3}\s+/.test(answer) || /(^|\n)\d+[.)]\s+/.test(answer) || /(^|\n)[-*•]\s+/.test(answer);
  return hasTrigger && isStructured;
}

function stripMarkdown(text: string) {
  return text.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-*•]\s+/gm, '').replace(/^\d+[.)]\s+/gm, '').trim();
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

  const lines = [
    `Gmail tool: User has ${result.messages.length} recent message(s).`,
    `Important: ${result.important.length}. Bills/payments: ${result.bills.length}. Low priority: ${result.lowPriority.length}.`,
  ];
  if (result.insight?.summary) lines.push(`Insight: ${result.insight.summary}`);
  lines.push(...result.messages.slice(0, 8).map((message, index) => {
    const parts = [`${index + 1}. ${message.subject}`, `from ${message.from}`];
    if (message.date) parts.push(`date ${message.date}`);
    if (message.snippet) parts.push(`snippet: ${message.snippet}`);
    return `- ${parts.join(' | ')}`;
  }));
  return lines.join('\n');
}

function buildPrivateToolContext(
  calendar: Awaited<ReturnType<typeof runCalendarTodayTool>>,
  gmail: GmailToolResult,
  outlook: OutlookToolResult,
  options: { includeCalendar: boolean; includeGmail: boolean; includeOutlook: boolean },
) {
  const sections: string[] = [];
  if (options.includeCalendar) sections.push(formatCalendarTodayForPrompt(calendar));
  if (options.includeGmail) sections.push(formatGmailForPrompt(gmail));
  if (options.includeOutlook) sections.push(formatOutlookForPrompt(outlook));

  if (!sections.length) return '';
  return ['Private user tool context:', 'Use this context only when relevant. Do not reveal internal tokens or implementation details.', ...sections].join('\n\n');
}

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

async function runModelWithSafeSearch(req: AgentRequest, useWebSearch: boolean, searchCountry?: string, toolContext?: string) {
  const safeMessage = safeUserMessage(req.message);
  const messages = [
    { role: 'system' as const, content: KIVO_SYSTEM_PROMPT },
    ...(toolContext ? [{ role: 'system' as const, content: toolContext }] : []),
    { role: 'user' as const, content: safeMessage },
  ];

  try {
    return await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: useWebSearch ? 'groq:compound' : undefined,
      webSearch: useWebSearch && searchCountry ? { country: searchCountry } : undefined,
      maxTokens: 900,
      messages,
    });
  } catch (error) {
    if (!useWebSearch) throw error;
    const fallbackMessages = [
      { role: 'system' as const, content: `${KIVO_SYSTEM_PROMPT}\n\nWeb search failed. Answer safely without pretending to have current sources.` },
      ...(toolContext ? [{ role: 'system' as const, content: toolContext }] : []),
      { role: 'user' as const, content: safeMessage },
    ];
    const fallback = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 700,
      messages: fallbackMessages,
    });
    return { ...fallback, raw: { fallback: true, originalError: error instanceof Error ? error.message : 'Web search failed' } };
  }
}

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);
  const needsClarification = shouldAskClarifyingQuestion(req.message);
  if (needsClarification) {
    const steps = buildExecutionSteps(req.message, { clarify: true });
    const answer = await buildClarifyingAnswer(req);
    return withStructuredData({ answer, steps, intent }, { clarification: { required: true, reason: 'Missing important context for a high-quality result.' } });
  }

  const messageText = req.message.toLowerCase();
  const includeCalendar = ['google calendar', 'kalenteri', 'calendar', 'today', 'tänään', 'tanaan', 'schedule', 'aikataulu', 'event', 'tapahtuma', 'meeting', 'kokous', 'päivä', 'paiva', 'vapaa', 'free time'].some((word) => messageText.includes(word));
  const includeGmail = shouldRunGmailTool(req.message);
  const includeOutlook = shouldRunOutlookTool(req.message);

  const [calendar, gmail, outlook] = await Promise.all([
    includeCalendar ? runCalendarTodayTool(req.userId) : Promise.resolve({ connected: false, events: [] }),
    includeGmail ? runGmailTool(req.userId) : Promise.resolve({ connected: false, messages: [], important: [], bills: [], lowPriority: [] }),
    includeOutlook ? runOutlookTool(req.userId) : Promise.resolve({ connected: false, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: [] }),
  ]);

  const toolContext = buildPrivateToolContext(calendar, gmail, outlook, { includeCalendar, includeGmail, includeOutlook });
  const useWebSearch = shouldUseWebSearch(req.message);
  const searchCountry = useWebSearch ? detectSearchCountry(req.message) : undefined;
  const response = await runModelWithSafeSearch(req, useWebSearch, searchCountry, toolContext);
  const fallbackUsed = Boolean((response.raw as any)?.fallback);
  const executionSteps = buildExecutionSteps(req.message, {
    calendar: includeCalendar && Boolean(calendar?.connected),
    gmail: includeGmail && Boolean(gmail?.connected),
    outlook: includeOutlook && Boolean(outlook?.connected),
    today: messageText.includes('päivä') || messageText.includes('today') || messageText.includes('tänään'),
    webSearch: useWebSearch,
    fallback: fallbackUsed,
  });
  const sources = response.sources ?? [];
  const sourceText = sources.length ? ['', '### Sources', ...sources.slice(0, 3).map((source, index) => `${index + 1}. ${source.title ?? 'Source'}${source.url ? ` — ${source.url}` : ''}`)].join('\n') : '';
  const answer = response.content + sourceText;
  const documentCard = shouldCreateDocumentCard(req.message, answer) ? buildDocumentCard(answer) : null;

  return withStructuredData(
    { answer, steps: executionSteps.length ? executionSteps : plan.steps.map((step) => ({ ...step, status: 'done' })), intent, model: response.model, provider: response.provider },
    {
      gmail: includeGmail ? gmail : null,
      calendar: includeCalendar ? calendar : null,
      outlook: includeOutlook ? outlook : null,
      documentCard,
      sources,
      webSearch: useWebSearch ? { used: !fallbackUsed, fallback: fallbackUsed, country: searchCountry ?? null } : { used: false },
    },
  );
}
