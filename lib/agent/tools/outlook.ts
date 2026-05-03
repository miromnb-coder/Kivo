import { createSupabaseServer } from '@/lib/supabase/server';

export type OutlookMessageSummary = {
  subject: string;
  from: string;
  date?: string;
  snippet?: string;
  importance?: string;
  isRead?: boolean;
  webLink?: string;
};

export type OutlookEventSummary = {
  subject: string;
  start?: string;
  end?: string;
  location?: string;
  organizer?: string;
  webLink?: string;
};

export type OutlookToolResult = {
  connected: boolean;
  messages: OutlookMessageSummary[];
  events: OutlookEventSummary[];
  important: OutlookMessageSummary[];
  bills: OutlookMessageSummary[];
  lowPriority: OutlookMessageSummary[];
  actions: string[];
  insight?: {
    title: string;
    summary: string;
    counts: {
      messages: number;
      events: number;
      important: number;
      bills: number;
      lowPriority: number;
    };
  };
  error?: string;
};

type MicrosoftIntegration = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

const MICROSOFT_PROVIDERS = ['microsoft', 'outlook_mail', 'outlook_calendar', 'microsoft_outlook_mail', 'microsoft_outlook_calendar'];

function tokenNeedsRefresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

async function findMicrosoftIntegration(userId: string): Promise<MicrosoftIntegration | null> {
  const { data } = await createSupabaseServer()
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .in('provider', MICROSOFT_PROVIDERS)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as MicrosoftIntegration | null) ?? null;
}

async function refreshMicrosoftAccessToken(integration: MicrosoftIntegration) {
  if (!integration.refresh_token) return null;

  const clientId = process.env.OUTLOOK_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  const tenant = process.env.OUTLOOK_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !clientSecret) return null;

  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
      scope: 'openid profile email offline_access User.Read Mail.Read Mail.Send Calendars.Read Calendars.ReadWrite',
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || !tokenData.access_token) return null;

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
    : integration.expires_at;

  await createSupabaseServer()
    .from('kivo_integrations')
    .update({
      access_token: String(tokenData.access_token),
      refresh_token: tokenData.refresh_token ?? integration.refresh_token,
      expires_at: expiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return String(tokenData.access_token);
}

async function getUsableAccessToken(integration: MicrosoftIntegration) {
  if (tokenNeedsRefresh(integration.expires_at)) {
    return refreshMicrosoftAccessToken(integration);
  }
  return integration.access_token;
}

function classifyMessages(messages: OutlookMessageSummary[]) {
  const importantKeywords = ['invoice', 'bill', 'receipt', 'payment', 'subscription', 'renewal', 'security', 'alert', 'verify', 'urgent', 'action required', 'lasku', 'maksu', 'turvallisuus', 'kiireellinen'];
  const billKeywords = ['invoice', 'bill', 'payment', 'receipt', 'subscription', 'renewal', 'lasku', 'maksu', 'kuitti', 'tilaus'];
  const lowPriorityKeywords = ['newsletter', 'promo', 'marketing', 'welcome', 'product update', 'free', 'sale', 'tarjous', 'uutiskirje'];

  const important: OutlookMessageSummary[] = [];
  const bills: OutlookMessageSummary[] = [];
  const lowPriority: OutlookMessageSummary[] = [];

  for (const message of messages) {
    const text = `${message.subject} ${message.snippet ?? ''} ${message.from}`.toLowerCase();
    const isBill = billKeywords.some((word) => text.includes(word));
    const isImportant = message.importance === 'high' || importantKeywords.some((word) => text.includes(word));
    const isLowPriority = !isBill && !isImportant && lowPriorityKeywords.some((word) => text.includes(word));

    if (isBill) bills.push(message);
    if (isImportant) important.push(message);
    if (isLowPriority) lowPriority.push(message);
  }

  return { important, bills, lowPriority };
}

function buildActions(messages: OutlookMessageSummary[], events: OutlookEventSummary[], bills: OutlookMessageSummary[], important: OutlookMessageSummary[]) {
  const actions: string[] = [];

  if (important.length) actions.push(`Review ${important.length} important Outlook email${important.length === 1 ? '' : 's'}.`);
  if (bills.length) actions.push(`Check ${bills.length} bill/payment related Outlook email${bills.length === 1 ? '' : 's'}.`);
  if (events.length) actions.push(`Plan around ${events.length} upcoming Outlook calendar event${events.length === 1 ? '' : 's'}.`);
  if (!actions.length && messages.length) actions.push('No urgent Outlook items found in the latest messages.');

  return actions;
}

function buildInsight(messages: OutlookMessageSummary[], events: OutlookEventSummary[], important: OutlookMessageSummary[], bills: OutlookMessageSummary[], lowPriority: OutlookMessageSummary[]) {
  const parts: string[] = [];
  if (important.length) parts.push(`${important.length} important email${important.length === 1 ? '' : 's'}`);
  if (bills.length) parts.push(`${bills.length} bill/payment item${bills.length === 1 ? '' : 's'}`);
  if (events.length) parts.push(`${events.length} upcoming calendar event${events.length === 1 ? '' : 's'}`);

  return {
    title: 'Outlook smart scan',
    summary: parts.length
      ? `I found ${parts.join(', ')} from Outlook.`
      : `I scanned ${messages.length} Outlook email${messages.length === 1 ? '' : 's'} and found no obvious urgent items.`,
    counts: {
      messages: messages.length,
      events: events.length,
      important: important.length,
      bills: bills.length,
      lowPriority: lowPriority.length,
    },
  };
}

async function fetchOutlook(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const now = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const mailUrl = 'https://graph.microsoft.com/v1.0/me/messages?$top=12&$select=subject,from,receivedDateTime,bodyPreview,importance,isRead,webLink&$orderby=receivedDateTime desc';
  const eventsUrl = `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(now)}&endDateTime=${encodeURIComponent(nextWeek)}&$top=12&$select=subject,start,end,location,organizer,webLink&$orderby=start/dateTime`;

  const [mailRes, calRes] = await Promise.all([
    fetch(mailUrl, { headers }),
    fetch(eventsUrl, { headers }),
  ]);

  if (!mailRes.ok && !calRes.ok) {
    throw new Error(`Microsoft Graph failed (${mailRes.status}/${calRes.status})`);
  }

  const mailJson = mailRes.ok ? await mailRes.json() : { value: [] };
  const calJson = calRes.ok ? await calRes.json() : { value: [] };

  const messages: OutlookMessageSummary[] = (mailJson.value ?? []).map((m: any) => ({
    subject: m.subject ?? '(No subject)',
    from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || 'Unknown sender',
    date: m.receivedDateTime,
    snippet: m.bodyPreview,
    importance: m.importance,
    isRead: m.isRead,
    webLink: m.webLink,
  }));

  const events: OutlookEventSummary[] = (calJson.value ?? []).map((e: any) => ({
    subject: e.subject ?? '(No title)',
    start: e.start?.dateTime,
    end: e.end?.dateTime,
    location: e.location?.displayName,
    organizer: e.organizer?.emailAddress?.name || e.organizer?.emailAddress?.address,
    webLink: e.webLink,
  }));

  return { messages, events };
}

export async function runOutlookTool(userId?: string): Promise<OutlookToolResult> {
  if (!userId) {
    return { connected: false, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: [], error: 'User not signed in' };
  }

  const integration = await findMicrosoftIntegration(userId);
  if (!integration?.access_token) {
    return { connected: false, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: [] };
  }

  try {
    let accessToken = await getUsableAccessToken(integration);
    if (!accessToken) {
      return { connected: true, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: ['Reconnect Outlook.'], error: 'Outlook reconnect required.' };
    }

    try {
      const { messages, events } = await fetchOutlook(accessToken);
      const { important, bills, lowPriority } = classifyMessages(messages);
      const actions = buildActions(messages, events, bills, important);
      return { connected: true, messages, events, important, bills, lowPriority, actions, insight: buildInsight(messages, events, important, bills, lowPriority) };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('(401)') || message.includes('401')) {
        accessToken = await refreshMicrosoftAccessToken(integration);
        if (!accessToken) {
          await createSupabaseServer().from('kivo_integrations').update({ status: 'needs_reconnect', updated_at: new Date().toISOString() }).eq('id', integration.id);
          return { connected: true, messages: [], events: [], important: [], bills: [], lowPriority: [], actions: ['Reconnect Outlook.'], error: 'Outlook reconnect required.' };
        }

        const { messages, events } = await fetchOutlook(accessToken);
        const { important, bills, lowPriority } = classifyMessages(messages);
        const actions = buildActions(messages, events, bills, important);
        return { connected: true, messages, events, important, bills, lowPriority, actions, insight: buildInsight(messages, events, important, bills, lowPriority) };
      }
      throw error;
    }
  } catch (error) {
    return {
      connected: true,
      messages: [],
      events: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: ['Outlook scan failed. Try reconnecting if this continues.'],
      error: error instanceof Error ? error.message : 'Outlook failed.',
    };
  }
}

export function shouldRunOutlookTool(message: string) {
  const text = message.toLowerCase();
  return ['outlook', 'microsoft mail', 'microsoft calendar', 'sähköposti', 'email', 'mail', 'kalenteri', 'calendar', 'kokous', 'meeting', 'lasku', 'bill', 'today', 'tänään'].some((word) => text.includes(word));
}

export function formatOutlookForPrompt(result: OutlookToolResult) {
  if (!result.connected) return 'Outlook tool: Outlook is not connected.';
  if (result.error) return `Outlook tool error: ${result.error}`;

  const lines = [
    `Outlook tool: ${result.messages.length} recent email(s), ${result.events.length} upcoming event(s).`,
    `Important: ${result.important.length}. Bills/payments: ${result.bills.length}. Low priority: ${result.lowPriority.length}.`,
  ];

  if (result.insight?.summary) lines.push(`Insight: ${result.insight.summary}`);
  if (result.actions.length) lines.push(`Suggested actions: ${result.actions.join(' | ')}`);

  if (result.messages.length) {
    lines.push('Recent Outlook emails:');
    lines.push(...result.messages.slice(0, 8).map((message, index) => {
      const parts = [`${index + 1}. ${message.subject}`, `from ${message.from}`];
      if (message.date) parts.push(`date ${message.date}`);
      if (message.importance) parts.push(`importance ${message.importance}`);
      if (message.snippet) parts.push(`snippet: ${message.snippet}`);
      return `- ${parts.join(' | ')}`;
    }));
  }

  if (result.events.length) {
    lines.push('Upcoming Outlook calendar events:');
    lines.push(...result.events.slice(0, 8).map((event, index) => {
      const parts = [`${index + 1}. ${event.subject}`];
      if (event.start) parts.push(`starts ${event.start}`);
      if (event.end) parts.push(`ends ${event.end}`);
      if (event.location) parts.push(`location ${event.location}`);
      return `- ${parts.join(' | ')}`;
    }));
  }

  return lines.join('\n');
}
