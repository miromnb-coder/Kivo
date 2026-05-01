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

function buildCalendarTable(calendar: any) {
  if (!calendar?.connected || !calendar.events?.length) return null;

  return {
    title: 'Kalenteri tänään',
    columns: ['Aika', 'Tapahtuma', 'Kesto'],
    rows: calendar.events.slice(0, 5).map((event: any) => [
      formatTime(event.start),
      event.summary ?? 'Untitled event',
      formatDuration(event.start, event.end),
    ]),
  };
}

function buildGmailTable(gmail: any) {
  if (!gmail?.connected) return null;

  const priorityRows = [
    ...(gmail.bills ?? []).slice(0, 3).map((m: any) => ['Lasku', m.subject ?? 'No subject', m.from ?? 'Unknown']),
    ...(gmail.important ?? []).slice(0, 3).map((m: any) => ['Tärkeä', m.subject ?? 'No subject', m.from ?? 'Unknown']),
  ];

  const fallbackRows = (gmail.messages ?? [])
    .slice(0, 5)
    .map((m: any) => ['Viesti', m.subject ?? 'No subject', m.from ?? 'Unknown']);

  const rows = (priorityRows.length ? priorityRows : fallbackRows).slice(0, 5);

  if (!rows.length) return null;

  return {
    title: 'Sähköposti',
    columns: ['Tyyppi', 'Otsikko', 'Lähettäjä'],
    rows,
  };
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

function buildMiniTable(calendar: any, gmail: any, message: string) {
  if (shouldRunGmailTool(message)) {
    return buildGmailTable(gmail) ?? buildTodayTable(calendar, gmail);
  }

  if (isCalendarRequest(message)) {
    return buildCalendarTable(calendar) ?? buildTodayTable(calendar, gmail);
  }

  if (calendar?.connected && gmail?.connected) {
    return buildTodayTable(calendar, gmail);
  }

  return buildCalendarTable(calendar) ?? buildGmailTable(gmail) ?? buildTodayTable(calendar, gmail);
}

function withStructuredData(base: Omit<AgentResult, 'structuredData'>, structuredData: any): AgentResult {
  return { ...base, structuredData } as AgentResult;
}

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);

  const calendar = await runCalendarTodayTool(req.userId);
  const gmail = await runGmailTool(req.userId);
  const tinySuggestion = buildTinySmartSuggestion(calendar, gmail);
  const miniTable = buildMiniTable(calendar, gmail, req.message);
  const structuredData = { tinySuggestion, miniTable, gmail, calendar };

  if (shouldRunGmailTool(req.message)) {
    if (!gmail.connected) {
      return withStructuredData({ answer: 'Gmail ei ole yhdistetty.', steps: [], intent }, structuredData);
    }

    if (gmail.error) {
      return withStructuredData({ answer: `Gmail virhe: ${gmail.error}`, steps: [], intent }, structuredData);
    }

    if (gmail.bills.length > 0) {
      return withStructuredData({ answer: `Sinulla on ${gmail.bills.length} laskuun liittyvää sähköpostia.`, steps: [], intent }, structuredData);
    }

    if (gmail.important.length > 0) {
      return withStructuredData({ answer: `Löysin ${gmail.important.length} tärkeää sähköpostia.`, steps: [], intent }, structuredData);
    }

    return withStructuredData(
      { answer: gmail.messages.length ? `Löysin ${gmail.messages.length} viimeisintä sähköpostia.` : 'Ei sähköposteja.', steps: [], intent },
      structuredData,
    );
  }

  if (calendar.connected && gmail.connected && calendar.events.length === 0 && gmail.bills.length > 0) {
    return withStructuredData(
      { answer: `Sinulla ei ole tapahtumia tänään, mutta sinulla on ${gmail.bills.length} laskuun liittyvää sähköpostia.`, steps: [], intent },
      structuredData,
    );
  }

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      {
        role: 'system',
        content: 'You are Kivo AI. Be proactive and smart.',
      },
      { role: 'user', content: req.message },
    ],
  });

  return withStructuredData(
    {
      answer: response.content,
      steps: plan.steps.map((s) => ({ ...s, status: 'done' })),
      intent,
    },
    structuredData,
  );
}
