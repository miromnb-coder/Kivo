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
  'Use clean Markdown in useful answers.',
  '- Use ## for main sections.',
  '- Use ### for subsections.',
  '- Use **bold** for key parts, decisions, times, priorities, names, and next actions.',
  '- Use numbered lists for steps and bullet lists for quick details.',
  '- Never use ===== or ----- underline headings.',
  '- Do not use + as bullet markers; use - instead.',
  '- Do not use bold-only lines as section titles; use ## or ###.',
  '- Keep spacing clean with short paragraphs and blank lines between sections.',
  '- Do not over-format short answers; keep simple answers clean.',
  'Be proactive and practical. If a complex task is missing key details, ask concise clarifying questions before doing the work.',
].join('\n');

function shouldAskClarifyingQuestion(message: string) {
  const text = message.toLowerCase().trim();
  const complex = ['suunnittele', 'tee minulle', 'rakenna', 'roadmap', 'plan', 'create', 'build', 'kirjoita', 'write'].some((word) => text.includes(word));
  if (!complex) return false;
  if (text.includes('tänään') || text.includes('today') || text.includes('gmail') || text.includes('sähköposti') || text.includes('kalenteri')) return false;
  const hasEnoughContext = ['budjetti', 'budget', 'aika', 'time', 'kaupunki', 'city', 'tavoite', 'goal', 'tyyli', 'style', 'deadline', 'jyväskylä', 'helsinki', 'kuopio'].some((word) => text.includes(word));
  return text.length < 90 && !hasEnoughContext;
}

function buildClarifyingAnswer() {
  return [
    '## Tarvitsen vielä vähän tarkennusta',
    '',
    '**Voin tehdä tämän, mutta jotta lopputulos olisi oikeasti hyvä, tarvitsen pari asiaa ensin.**',
    '',
    '1. Mikä on tärkein tavoite?',
    '2. Onko tähän jokin aika, paikka, budjetti tai deadline?',
    '3. Haluatko lopputuloksen lyhyenä suunnitelmana vai valmiina tekstinä?',
    '',
    'Kun vastaat näihin, teen siitä heti paremman kokonaisuuden.',
  ].join('\n');
}

function shouldShowExecutionSteps(message: string) {
  const text = message.toLowerCase().trim();
  if (!text || ['hei', 'moi', 'hello', 'hi', 'ok', 'kiitos'].includes(text)) return false;
  if (text.length < 18) return false;

  const complexWords = [
    'suunnittele', 'tee minulle', 'rakenna', 'analysoi', 'etsi', 'hae', 'selvitä', 'vertaa', 'kirjoita',
    'roadmap', 'plan', 'analyze', 'research', 'build', 'create', 'write', 'compare', 'summary', 'yhteenveto',
    'kalenteri', 'calendar', 'gmail', 'sähköposti', 'email', 'päivä', 'today', 'aikataulu', 'schedule',
  ];

  return complexWords.some((word) => text.includes(word));
}

function buildExecutionSteps(message: string, options?: { calendar?: boolean; gmail?: boolean; today?: boolean; clarify?: boolean }): ExecutionStep[] {
  if (options?.clarify) {
    return [
      {
        title: 'Tarkistetaan puuttuuko tietoja',
        detail: 'Kivo huomaa, että hyvä vastaus vaatii vielä tarkennuksia.',
        status: 'done',
        kind: 'think',
      },
    ];
  }

  if (!shouldShowExecutionSteps(message)) return [];

  const text = message.toLowerCase();
  const steps: ExecutionStep[] = [
    {
      title: 'Ymmärretään pyyntö',
      detail: 'Kivo tunnistaa tavoitteen ja valitsee sopivan vastaustavan.',
      status: 'done',
      kind: 'think',
    },
  ];

  if (options?.gmail || shouldRunGmailTool(message)) {
    steps.push({
      title: 'Tarkistetaan Gmail-konteksti',
      detail: 'Haetaan tärkeät viestit, laskut ja mahdolliset action itemit.',
      status: 'done',
      kind: 'tool',
    });
  }

  if (options?.calendar || text.includes('kalenteri') || text.includes('calendar') || text.includes('päivä') || text.includes('today')) {
    steps.push({
      title: 'Tarkistetaan kalenteri',
      detail: 'Haetaan päivän tapahtumat ja vapaat aikaikkunat.',
      status: 'done',
      kind: 'tool',
    });
  }

  if (text.includes('etsi') || text.includes('hae') || text.includes('research') || text.includes('selvitä')) {
    steps.push({
      title: 'Kootaan tarvittava tieto',
      detail: 'Kerätään oleelliset tiedot ennen lopullista vastausta.',
      status: 'done',
      kind: 'search',
    });
  }

  steps.push({
    title: options?.today ? 'Rakennetaan päivän suunnitelma' : 'Rakennetaan vastaus',
    detail: 'Järjestetään tieto selkeäksi ja käyttökelpoiseksi kokonaisuudeksi.',
    status: 'done',
    kind: 'plan',
  });

  if (text.includes('kirjoita') || text.includes('write') || text.includes('roadmap') || text.includes('suunnitelma') || text.includes('plan')) {
    steps.push({
      title: 'Muotoillaan valmis lopputulos',
      detail: 'Tehdään vastauksesta helposti luettava ja jatkokäytettävä.',
      status: 'done',
      kind: 'write',
    });
  }

  return steps.slice(0, 5);
}

function shouldCreateDocumentCard(message: string, answer: string) {
  const text = message.toLowerCase();
  if (!answer || answer.length < 700) return false;

  const triggers = [
    'suunnittele', 'plan', 'kirjoita', 'write', 'tee minulle', 'create', 'rakenna', 'build',
    'roadmap', 'aikataulu', 'päivä', 'ohjelma', 'suunnitelma', 'opas', 'guide', 'raportti', 'report',
  ];

  const hasTrigger = triggers.some((trigger) => text.includes(trigger));
  const isStructured = /(^|\n)#{1,3}\s+/.test(answer) || /(^|\n)\d+[.)]\s+/.test(answer) || /(^|\n)[-*•]\s+/.test(answer);

  return hasTrigger && isStructured;
}

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .trim();
}

function buildDocumentCard(answer: string) {
  const lines = answer.split('\n').map((line) => line.trim()).filter(Boolean);
  const titleLine = lines.find((line) => /^#{1,3}\s+/.test(line)) || lines.find((line) => /^\*\*(.+?)\*\*:?$/.test(line)) || lines[0] || 'Kivo document';
  const title = stripMarkdown(titleLine).slice(0, 80) || 'Kivo document';

  return {
    title,
    type: 'Markdown',
    content: answer,
  };
}

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);
  const needsClarification = shouldAskClarifyingQuestion(req.message);

  if (needsClarification) {
    const steps = buildExecutionSteps(req.message, { clarify: true });
    return withStructuredData(
      { answer: buildClarifyingAnswer(), steps, intent },
      { clarification: { required: true, reason: 'Missing important context for a high-quality result.' } },
    );
  }

  const calendar = await runCalendarTodayTool(req.userId);
  const gmail = await runGmailTool(req.userId);
  const executionSteps = buildExecutionSteps(req.message, {
    calendar: Boolean(calendar?.connected),
    gmail: shouldRunGmailTool(req.message) && Boolean(gmail?.connected),
    today: req.message.toLowerCase().includes('päivä') || req.message.toLowerCase().includes('today'),
  });

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      { role: 'system', content: KIVO_SYSTEM_PROMPT },
      { role: 'user', content: req.message },
    ],
  });

  const documentCard = shouldCreateDocumentCard(req.message, response.content) ? buildDocumentCard(response.content) : null;

  return withStructuredData(
    {
      answer: response.content,
      steps: executionSteps.length ? executionSteps : plan.steps.map((step) => ({ ...step, status: 'done' })),
      intent,
    },
    {
      gmail: null,
      calendar: null,
      documentCard,
    },
  );
}
