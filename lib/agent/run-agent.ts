import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { runCalendarTodayTool } from './tools/calendar';
import { runGmailTool, shouldRunGmailTool } from './tools/gmail';
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
  'Style rules:',
  '- Keep paragraphs short.',
  '- Add blank lines between sections.',
  '- Prefer readable structure over long blocks of text.',
  '- Do not over-format very short answers.',
  '- Do not use raw markdown symbols incorrectly.',
  '- Never use ===== or ----- underline headings.',
  '- Do not use + as bullet markers; use - instead.',
  '- Do not use bold-only lines as section titles; use ## or ### instead.',
  '- Do not start headings with emojis unless the user specifically wants a playful style.',
  '',
  'Streaming-friendly rules:',
  '- Never output incomplete markdown syntax intentionally.',
  '- Do not write headings like ### alone.',
  '- Do not leave unfinished code fences.',
  '- If using a code block, always close it.',
  '- If using a table, keep it simple and valid.',
  '- If the answer is short, use plain text instead of unnecessary markdown.',
  '',
  'Response quality:',
  '- Answer directly first.',
  '- Then add structure only if useful.',
  '- Be practical and specific.',
  '- When giving steps, make them actionable.',
  '- When uncertain, say so clearly.',
  '- When web search is used, mention uncertainty and sources when relevant.',
  '- If important details are missing for a complex task, ask a short clarifying question.',
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
  const currentSignals = ['uusin', 'latest', 'tänään', 'today', 'nyt', 'now', 'current', 'ajankohtainen', 'news', 'uutiset', 'hinta', 'price', 'halvin', 'cheapest', 'saatavilla', 'available', 'osto', 'buy', 'kauppa', 'store', 'auki', 'open now', 'ravintola', 'restaurant', 'kahvila', 'cafe', 'hotelli', 'hotel', 'tapahtuma', 'event', 'near me', 'lähellä', 'paras paikka', 'best place', 'matka', 'travel', 'weather', 'sää'];
  const researchSignals = ['etsi', 'hae', 'selvitä', 'research', 'find', 'search', 'compare', 'vertaa'];
  const locationSignals = ['jyväskylä', 'kuopio', 'helsinki', 'tokyo', 'london', 'paris', 'new york', 'san francisco', 'berlin', 'stockholm', 'osaka'];
  return currentSignals.some((word) => text.includes(word)) || researchSignals.some((word) => text.includes(word)) || locationSignals.some((word) => text.includes(word));
}

function detectSearchCountry(message: string) {
  const text = message.toLowerCase();
  const pairs: Array<[string, string]> = [['jyväskylä', 'finland'], ['kuopio', 'finland'], ['helsinki', 'finland'], ['suomi', 'finland'], ['finland', 'finland'], ['tokyo', 'japan'], ['osaka', 'japan'], ['japan', 'japan'], ['new york', 'united states'], ['san francisco', 'united states'], ['usa', 'united states'], ['united states', 'united states'], ['london', 'united kingdom'], ['uk', 'united kingdom'], ['united kingdom', 'united kingdom'], ['paris', 'france'], ['france', 'france'], ['berlin', 'germany'], ['germany', 'germany'], ['stockholm', 'sweden'], ['sweden', 'sweden']];
  return pairs.find(([key]) => text.includes(key))?.[1];
}

function shouldAskClarifyingQuestion(message: string) {
  const text = message.toLowerCase().trim();
  const complex = ['suunnittele', 'tee minulle', 'rakenna', 'roadmap', 'plan', 'create', 'build', 'kirjoita', 'write'].some((word) => text.includes(word));
  if (!complex) return false;
  if (text.includes('tänään') || text.includes('today') || text.includes('gmail') || text.includes('sähköposti') || text.includes('kalenteri')) return false;
  const hasEnoughContext = ['budjetti', 'budget', 'aika', 'time', 'kaupunki', 'city', 'tavoite', 'goal', 'tyyli', 'style', 'deadline', 'jyväskylä', 'helsinki', 'kuopio', 'tokyo', 'london', 'paris'].some((word) => text.includes(word));
  return text.length < 90 && !hasEnoughContext;
}

function buildClarifyingAnswer() {
  return ['## Tarvitsen vielä vähän tarkennusta', '', '**Voin tehdä tämän, mutta jotta lopputulos olisi oikeasti hyvä, tarvitsen pari asiaa ensin.**', '', '1. Mikä on tärkein tavoite?', '2. Onko tähän jokin aika, paikka, budjetti tai deadline?', '3. Haluatko lopputuloksen lyhyenä suunnitelmana vai valmiina tekstinä?', '', 'Kun vastaat näihin, teen siitä heti paremman kokonaisuuden.'].join('\n');
}

function shouldShowExecutionSteps(message: string) {
  const text = message.toLowerCase().trim();
  if (!text || ['hei', 'moi', 'hello', 'hi', 'ok', 'kiitos'].includes(text)) return false;
  if (text.length < 18) return false;
  const complexWords = ['suunnittele', 'tee minulle', 'rakenna', 'analysoi', 'etsi', 'hae', 'selvitä', 'vertaa', 'kirjoita', 'roadmap', 'plan', 'analyze', 'research', 'build', 'create', 'write', 'compare', 'summary', 'yhteenveto', 'kalenteri', 'calendar', 'gmail', 'sähköposti', 'email', 'päivä', 'today', 'aikataulu', 'schedule', 'ravintola', 'kahvila', 'hinta', 'uutiset'];
  return complexWords.some((word) => text.includes(word));
}

function buildExecutionSteps(message: string, options?: { calendar?: boolean; gmail?: boolean; today?: boolean; clarify?: boolean; webSearch?: boolean; fallback?: boolean }): ExecutionStep[] {
  if (options?.clarify) return [{ title: 'Tarkistetaan puuttuuko tietoja', detail: 'Kivo huomaa, että hyvä vastaus vaatii vielä tarkennuksia.', status: 'done', kind: 'think' }];
  if (!shouldShowExecutionSteps(message)) return [];
  const text = message.toLowerCase();
  const steps: ExecutionStep[] = [{ title: 'Ymmärretään pyyntö', detail: 'Kivo tunnistaa tavoitteen ja valitsee sopivan vastaustavan.', status: 'done', kind: 'think' }];
  if (options?.gmail || shouldRunGmailTool(message)) steps.push({ title: 'Tarkistetaan Gmail-konteksti', detail: 'Haetaan tärkeät viestit, laskut ja mahdolliset action itemit.', status: 'done', kind: 'tool' });
  if (options?.calendar && (text.includes('kalenteri') || text.includes('calendar') || text.includes('päivä') || text.includes('today'))) steps.push({ title: 'Tarkistetaan kalenteri', detail: 'Haetaan päivän tapahtumat ja vapaat aikaikkunat.', status: 'done', kind: 'tool' });
  if (options?.webSearch) steps.push({ title: options.fallback ? 'Web search ei onnistunut, jatketaan turvallisesti' : 'Etsitään ajankohtaista tietoa verkosta', detail: options.fallback ? 'Kivo antaa vastauksen ilman lähteitä, jotta keskustelu ei jää jumiin.' : 'Kivo käyttää web searchia tuoreisiin lähteisiin ja paikkakohtaiseen tietoon.', status: 'done', kind: 'search' });
  else if (text.includes('etsi') || text.includes('hae') || text.includes('research') || text.includes('selvitä')) steps.push({ title: 'Kootaan tarvittava tieto', detail: 'Kerätään oleelliset tiedot ennen lopullista vastausta.', status: 'done', kind: 'search' });
  steps.push({ title: options?.today ? 'Rakennetaan päivän suunnitelma' : 'Rakennetaan vastaus', detail: 'Järjestetään tieto selkeäksi ja käyttökelpoiseksi kokonaisuudeksi.', status: 'done', kind: 'plan' });
  if (text.includes('kirjoita') || text.includes('write') || text.includes('roadmap') || text.includes('suunnitelma') || text.includes('plan')) steps.push({ title: 'Muotoillaan valmis lopputulos', detail: 'Tehdään vastauksesta helposti luettava ja jatkokäytettävä.', status: 'done', kind: 'write' });
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

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

async function runModelWithSafeSearch(req: AgentRequest, useWebSearch: boolean, searchCountry?: string) {
  const safeMessage = safeUserMessage(req.message);
  try {
    return await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: useWebSearch ? 'groq:compound' : undefined,
      webSearch: useWebSearch && searchCountry ? { country: searchCountry } : undefined,
      maxTokens: useWebSearch ? 900 : 900,
      messages: [{ role: 'system', content: KIVO_SYSTEM_PROMPT }, { role: 'user', content: safeMessage }],
    });
  } catch (error) {
    if (!useWebSearch) throw error;
    const fallbackPrompt = [KIVO_SYSTEM_PROMPT, '', 'Web search failed. Answer safely without pretending to have current sources. Be clear that live source lookup was unavailable.'].join('\n');
    const fallback = await runKivoModel({
      agent: req.agent,
      mode: req.mode,
      context: req.context,
      forceModel: 'groq:fast',
      maxTokens: 700,
      messages: [{ role: 'system', content: fallbackPrompt }, { role: 'user', content: safeMessage }],
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
    return withStructuredData({ answer: buildClarifyingAnswer(), steps, intent }, { clarification: { required: true, reason: 'Missing important context for a high-quality result.' } });
  }

  const calendar = await runCalendarTodayTool(req.userId);
  const gmail = await runGmailTool(req.userId);
  const useWebSearch = shouldUseWebSearch(req.message);
  const searchCountry = useWebSearch ? detectSearchCountry(req.message) : undefined;
  const response = await runModelWithSafeSearch(req, useWebSearch, searchCountry);
  const fallbackUsed = Boolean((response.raw as any)?.fallback);
  const executionSteps = buildExecutionSteps(req.message, { calendar: Boolean(calendar?.connected), gmail: shouldRunGmailTool(req.message) && Boolean(gmail?.connected), today: req.message.toLowerCase().includes('päivä') || req.message.toLowerCase().includes('today'), webSearch: useWebSearch, fallback: fallbackUsed });
  const sources = response.sources ?? [];
  const sourceText = sources.length ? ['', '### Sources', ...sources.slice(0, 3).map((source, index) => `${index + 1}. ${source.title ?? 'Source'}${source.url ? ` — ${source.url}` : ''}`)].join('\n') : '';
  const answer = response.content + sourceText;
  const documentCard = shouldCreateDocumentCard(req.message, answer) ? buildDocumentCard(answer) : null;

  return withStructuredData({ answer, steps: executionSteps.length ? executionSteps : plan.steps.map((step) => ({ ...step, status: 'done' })), intent, model: response.model, provider: response.provider }, { gmail: null, calendar: null, documentCard, sources, webSearch: useWebSearch ? { used: !fallbackUsed, fallback: fallbackUsed, country: searchCountry ?? null } : { used: false } });
}
