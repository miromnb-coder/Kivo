import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { runCalendarTodayTool } from './tools/calendar';
import { runGmailTool, shouldRunGmailTool } from './tools/gmail';
import { routeIntent } from './router';
import type { AgentRequest, AgentResult } from './types';

function buildTinySmartSuggestion(calendar: any, gmail: any) {
  if (!calendar?.connected || !gmail?.connected) return null;

  if (calendar.events?.length === 0 && gmail.bills?.length > 0) {
    return {
      type: 'bill_focus',
      title: 'Lasku + vapaa hetki',
      subtitle: `${gmail.bills.length} laskuun liittyvä sähköposti. Tänään ei ole tapahtumia.`,
      actionLabel: 'Katso',
      size: 'tiny',
    };
  }

  if (gmail.important?.length > 0) {
    return {
      type: 'important_email',
      title: 'Tärkeä sähköposti',
      subtitle: gmail.important[0]?.subject ?? 'Tarkista inbox.',
      actionLabel: 'Avaa',
      size: 'tiny',
    };
  }

  return null;
}

function formatTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fi-FI', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' }).format(date);
}

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return '—';
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return '—';
  const minutes = Math.round((b - a) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

function getTodayWindow() {
  const start = new Date();
  start.setHours(8, 0, 0, 0);
  const end = new Date();
  end.setHours(22, 0, 0, 0);
  return { start, end };
}

function buildFreeTimeWindows(calendar: any) {
  if (!calendar?.connected) return [];

  const events = [...(calendar.events ?? [])]
    .map((event: any) => ({ start: new Date(event.start), end: new Date(event.end) }))
    .filter((event: any) => !Number.isNaN(event.start.getTime()) && !Number.isNaN(event.end.getTime()) && event.end > event.start)
    .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());

  const { start: dayStart, end: dayEnd } = getTodayWindow();
  const windows: Array<{ start: string; end: string; label: string; minutes: number }> = [];
  let cursor = new Date(Math.max(dayStart.getTime(), Date.now()));

  for (const event of events) {
    if (event.end <= cursor) continue;
    if (event.start > cursor) {
      const minutes = Math.round((event.start.getTime() - cursor.getTime()) / 60000);
      if (minutes >= 30) {
        windows.push({ start: cursor.toISOString(), end: event.start.toISOString(), label: `${formatTime(cursor.toISOString())}–${formatTime(event.start.toISOString())}`, minutes });
      }
    }
    if (event.end > cursor) cursor = event.end;
  }

  if (cursor < dayEnd) {
    const minutes = Math.round((dayEnd.getTime() - cursor.getTime()) / 60000);
    if (minutes >= 30) {
      windows.push({ start: cursor.toISOString(), end: dayEnd.toISOString(), label: `${formatTime(cursor.toISOString())}–${formatTime(dayEnd.toISOString())}`, minutes });
    }
  }

  return windows.slice(0, 4);
}

function buildTodayIntelligenceV2(calendar: any, gmail: any) {
  const freeTime = buildFreeTimeWindows(calendar);
  const topPriorities: Array<{ title: string; reason: string; source: 'gmail' | 'calendar' | 'system'; score: number }> = [];

  for (const message of (gmail?.bills ?? []).slice(0, 3)) {
    topPriorities.push({ title: message.subject ?? 'Tarkista laskuun liittyvä sähköposti', reason: 'Löytyi laskuun, maksuun tai uusimiseen liittyvästä sähköpostista.', source: 'gmail', score: 95 });
  }

  for (const message of (gmail?.important ?? []).slice(0, 3)) {
    topPriorities.push({ title: message.subject ?? 'Tarkista tärkeä sähköposti', reason: 'Sähköposti näyttää tärkeältä tai vaatii huomiota.', source: 'gmail', score: 85 });
  }

  for (const event of (calendar?.events ?? []).slice(0, 3)) {
    topPriorities.push({ title: event.summary ?? 'Kalenteritapahtuma', reason: `Tänään kalenterissa ${formatTime(event.start)} (${formatDuration(event.start, event.end)}).`, source: 'calendar', score: 75 });
  }

  if (!topPriorities.length) {
    topPriorities.push({ title: 'Suunnittele päivän tärkein tehtävä', reason: 'Kalenterista tai sähköposteista ei löytynyt kiireellisiä asioita.', source: 'system', score: 50 });
  }

  topPriorities.sort((a, b) => b.score - a.score);

  const nextAction = topPriorities[0]
    ? {
        title: topPriorities[0].title,
        source: topPriorities[0].source,
        suggestedWindow: freeTime[0]?.label ?? null,
        instruction: freeTime[0] ? `Aloita tämä seuraavassa vapaassa ikkunassa ${freeTime[0].label}.` : 'Tarkista tämä seuraavaksi, kun sinulla on vapaa hetki.',
      }
    : null;

  const riskLevel = (gmail?.bills?.length ?? 0) > 0 || (calendar?.events?.length ?? 0) >= 5 ? 'medium' : 'low';
  const riskReason = riskLevel === 'medium' ? 'Päivässä on joko laskuihin liittyviä viestejä tai useita kalenteritapahtumia.' : 'Ei selviä kiireellisiä riskejä löydetty.';

  return {
    version: 2,
    title: 'Today Intelligence',
    connectedSources: { gmail: Boolean(gmail?.connected), calendar: Boolean(calendar?.connected) },
    topPriorities: topPriorities.slice(0, 5),
    nextAction,
    freeTime,
    risk: { level: riskLevel, reason: riskReason },
    summary: {
      calendarEvents: calendar?.events?.length ?? 0,
      importantEmails: gmail?.important?.length ?? 0,
      bills: gmail?.bills?.length ?? 0,
      freeWindows: freeTime.length,
    },
  };
}

function buildCalendarTable(calendar: any) {
  if (!calendar?.connected || !calendar.events?.length) return null;
  return {
    title: 'Kalenteri tänään',
    columns: ['Aika', 'Tapahtuma', 'Kesto'],
    rows: calendar.events.slice(0, 5).map((event: any) => [formatTime(event.start), event.summary ?? 'Untitled event', formatDuration(event.start, event.end)]),
  };
}

function buildGmailTable(gmail: any) {
  if (!gmail?.connected) return null;

  const priorityRows = [
    ...(gmail.bills ?? []).slice(0, 3).map((m: any) => ['Lasku', m.subject ?? 'No subject', m.from ?? 'Unknown']),
    ...(gmail.important ?? []).slice(0, 3).map((m: any) => ['Tärkeä', m.subject ?? 'No subject', m.from ?? 'Unknown']),
  ];

  const fallbackRows = (gmail.messages ?? []).slice(0, 5).map((m: any) => ['Viesti', m.subject ?? 'No subject', m.from ?? 'Unknown']);
  const rows = (priorityRows.length ? priorityRows : fallbackRows).slice(0, 5);
  if (!rows.length) return null;

  return { title: 'Sähköposti', columns: ['Tyyppi', 'Otsikko', 'Lähettäjä'], rows };
}

function buildTodayTable(calendar: any, gmail: any) {
  if (!calendar?.connected && !gmail?.connected) return null;
  return {
    title: 'Today',
    columns: ['Alue', 'Tilanne', 'Ehdotus'],
    rows: [
      ['Calendar', calendar?.events?.length ? `${calendar.events.length} tapahtumaa` : 'Ei tapahtumia', calendar?.events?.length ? 'Tarkista päivän rytmi' : 'Voit suunnitella päivän'],
      ['Gmail', gmail?.important?.length ? `${gmail.important.length} tärkeää` : 'Ei tärkeitä', gmail?.bills?.length ? 'Tarkista laskut' : 'Inbox ok'],
    ],
  };
}

function isCalendarRequest(message: string) {
  const text = message.toLowerCase();
  return ['kalenteri', 'calendar', 'tänään', 'tanaan', 'aikataulu', 'schedule', 'tapahtuma', 'event'].some((word) => text.includes(word));
}

function isTodayOperatorRequest(message: string) {
  const text = message.toLowerCase();
  return ['mitä minun pitäisi tehdä', 'mitä pitäisi tehdä', 'mitä teen tänään', 'päiväni', 'suunnittele päivä', 'today plan', 'what should i do today', 'what do i need to focus on today', 'plan my day'].some((phrase) => text.includes(phrase));
}

function shouldShowMiniTable(message: string) {
  return shouldRunGmailTool(message) || isCalendarRequest(message) || isTodayOperatorRequest(message);
}

function buildMiniTable(calendar: any, gmail: any, message: string) {
  if (!shouldShowMiniTable(message)) return null;
  if (shouldRunGmailTool(message)) return buildGmailTable(gmail) ?? buildTodayTable(calendar, gmail);
  if (isCalendarRequest(message)) return buildCalendarTable(calendar) ?? buildTodayTable(calendar, gmail);
  if (isTodayOperatorRequest(message)) return buildTodayTable(calendar, gmail);
  return null;
}

function buildDailyAnswerV2(todayPlan: any) {
  const priorities = todayPlan?.topPriorities ?? [];
  const first = priorities[0];
  const freeWindow = todayPlan?.freeTime?.[0]?.label;
  const summary = todayPlan?.summary ?? {};

  if (!first) {
    return '## Tänään\n\nEn löytänyt kiireellisiä asioita kalenterista tai sähköposteista.\n\n**Seuraava paras askel:** valitse yksi tärkeä tehtävä ja tee siitä 25 minuutin aloitus.';
  }

  const lines: string[] = [];
  lines.push('## Tänään kannattaa keskittyä tähän');
  lines.push('');
  lines.push(`**${first.title}**`);
  lines.push('');
  lines.push(first.reason);
  lines.push('');

  if (freeWindow) {
    lines.push('### Paras hetki');
    lines.push(`**${freeWindow}**`);
    lines.push('');
  }

  lines.push('### Seuraava askel');
  lines.push(todayPlan?.nextAction?.instruction ?? 'Aloita tästä yhdellä pienellä askeleella.');
  lines.push('');

  const otherPriorities = priorities.slice(1, 4);
  if (otherPriorities.length) {
    lines.push('### Muut tärkeät');
    for (const item of otherPriorities) {
      lines.push(`- **${item.title}** — ${item.source === 'gmail' ? 'sähköpostista' : item.source === 'calendar' ? 'kalenterista' : 'suunnittelusta'}`);
    }
    lines.push('');
  }

  lines.push('### Nopea tilanne');
  lines.push(`- **${summary.calendarEvents ?? 0}** kalenteritapahtumaa tänään`);
  lines.push(`- **${summary.importantEmails ?? 0}** tärkeää sähköpostia`);
  lines.push(`- **${summary.bills ?? 0}** laskuun tai maksuun liittyvää viestiä`);
  lines.push(`- **${summary.freeWindows ?? 0}** vapaata aikaikkunaa`);

  if (todayPlan?.risk?.level === 'medium') {
    lines.push('');
    lines.push('### Huomio');
    lines.push(todayPlan.risk.reason);
  }

  return lines.join('\n');
}

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);

  const calendar = await runCalendarTodayTool(req.userId);
  const gmail = await runGmailTool(req.userId);
  const showMiniTable = shouldShowMiniTable(req.message);
  const tinySuggestion = showMiniTable ? buildTinySmartSuggestion(calendar, gmail) : null;
  const miniTable = buildMiniTable(calendar, gmail, req.message);
  const todayPlan = buildTodayIntelligenceV2(calendar, gmail);
  const structuredData = { tinySuggestion, miniTable, todayPlan, gmail: showMiniTable ? gmail : null, calendar: showMiniTable ? calendar : null };

  if (shouldRunGmailTool(req.message)) {
    if (!gmail.connected) return withStructuredData({ answer: 'Gmail ei ole yhdistetty.', steps: [], intent }, structuredData);
    if (gmail.error) return withStructuredData({ answer: `Gmail virhe: ${gmail.error}`, steps: [], intent }, structuredData);
    if (gmail.bills.length > 0) return withStructuredData({ answer: `## Sähköposti\n\nSinulla on **${gmail.bills.length}** laskuun liittyvää sähköpostia.`, steps: [], intent }, structuredData);
    if (gmail.important.length > 0) return withStructuredData({ answer: `## Sähköposti\n\nLöysin **${gmail.important.length}** tärkeää sähköpostia.`, steps: [], intent }, structuredData);
    return withStructuredData({ answer: gmail.messages.length ? `## Sähköposti\n\nLöysin **${gmail.messages.length}** viimeisintä sähköpostia.` : 'Ei sähköposteja.', steps: [], intent }, structuredData);
  }

  if (isTodayOperatorRequest(req.message)) {
    return withStructuredData({ answer: buildDailyAnswerV2(todayPlan), steps: [], intent }, structuredData);
  }

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      {
        role: 'system',
        content: 'You are Kivo AI. Use Markdown for hierarchy: ## for main sections, ### for smaller sections, **bold** for key decisions. Be proactive and practical. When calendar or Gmail context is available, suggest next actions without making changes unless the user confirms. Use tables/cards only when structuredData is available in the UI; keep the text itself clean and readable.',
      },
      { role: 'user', content: req.message },
    ],
  });

  return withStructuredData({ answer: response.content, steps: plan.steps.map((s) => ({ ...s, status: 'done' })), intent }, structuredData);
}
