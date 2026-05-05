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
  warnings?: string[];
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
  provider?: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes?: string[] | string | null;
  status?: string | null;
};

type OutlookFetchResult = {
  messages: OutlookMessageSummary[];
  events: OutlookEventSummary[];
  warnings: string[];
};

const MICROSOFT_PROVIDERS = [
  'microsoft',
  'outlook_mail',
  'outlook_calendar',
  'microsoft_outlook_mail',
  'microsoft_outlook_calendar',
];

const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.Send',
  'Calendars.Read',
  'Calendars.ReadWrite',
];

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scopesToText(scopes: unknown) {
  if (Array.isArray(scopes)) return scopes.map(String).join(' ').toLowerCase();
  if (typeof scopes === 'string') return scopes.toLowerCase();
  return '';
}

function hasKnownOutlookScope(scopes: unknown) {
  const text = scopesToText(scopes);

  if (!text) return true;

  return (
    text.includes('mail.read') ||
    text.includes('mail.send') ||
    text.includes('calendars.read') ||
    text.includes('calendars.readwrite') ||
    text.includes('user.read')
  );
}

function tokenNeedsRefresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

function isAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('(401)') || message.includes('401') || message.toLowerCase().includes('unauthorized');
}

function isPermissionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('(403)') ||
    message.includes('403') ||
    message.toLowerCase().includes('insufficient') ||
    message.toLowerCase().includes('permission') ||
    message.toLowerCase().includes('scope') ||
    message.toLowerCase().includes('consent')
  );
}

async function markNeedsReconnect(integrationId: string) {
  await createSupabaseServer()
    .from('kivo_integrations')
    .update({
      status: 'needs_reconnect',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);
}

async function findMicrosoftIntegration(userId: string): Promise<MicrosoftIntegration | null> {
  const { data } = await createSupabaseServer()
    .from('kivo_integrations')
    .select('id, provider, access_token, refresh_token, expires_at, scopes, status')
    .eq('user_id', userId)
    .in('provider', MICROSOFT_PROVIDERS)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.access_token && hasKnownOutlookScope(data.scopes)) {
    return data as MicrosoftIntegration;
  }

  return null;
}

async function refreshMicrosoftAccessToken(integration: MicrosoftIntegration): Promise<string | null> {
  if (!integration.refresh_token) {
    if (integration.expires_at && tokenNeedsRefresh(integration.expires_at)) {
      await markNeedsReconnect(integration.id);
      return null;
    }

    return integration.access_token;
  }

  const clientId = process.env.OUTLOOK_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  const tenant = process.env.OUTLOOK_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !clientSecret) {
    return integration.access_token;
  }

  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
      scope: MICROSOFT_SCOPES.join(' '),
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || !tokenData.access_token) {
    await markNeedsReconnect(integration.id);
    return null;
  }

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

function getMessageText(message: OutlookMessageSummary) {
  return normalizeText(`${message.subject ?? ''} ${message.snippet ?? ''} ${message.from ?? ''}`);
}

function classifyMessages(messages: OutlookMessageSummary[]) {
  const importantSignals = [
    'urgent',
    'important',
    'action required',
    'requires action',
    'security',
    'alert',
    'verification',
    'verify',
    'sign in',
    'login',
    'account',
    'deadline',
    'overdue',
    'failed payment',
    'payment failed',
    'unusual activity',
    'password',
  ];

  const billSignals = [
    'invoice',
    'bill',
    'billing',
    'payment',
    'receipt',
    'subscription',
    'renewal',
    'due',
    'order',
    'purchase',
    'charged',
    'charge',
    'refund',
    'bank',
    'statement',
  ];

  const lowPrioritySignals = [
    'newsletter',
    'marketing',
    'promo',
    'promotion',
    'discount',
    'sale',
    'welcome',
    'product update',
    'contest',
    'credits',
    'free credits',
    'digest',
    'weekly update',
  ];

  const important: OutlookMessageSummary[] = [];
  const bills: OutlookMessageSummary[] = [];
  const lowPriority: OutlookMessageSummary[] = [];

  for (const message of messages) {
    const text = getMessageText(message);
    const isBill = billSignals.some((signal) => text.includes(signal));
    const isImportant =
      message.importance === 'high' ||
      isBill ||
      importantSignals.some((signal) => text.includes(signal));
    const isLowPriority =
      !isBill &&
      !isImportant &&
      lowPrioritySignals.some((signal) => text.includes(signal));

    if (isBill) bills.push(message);
    if (isImportant) important.push(message);
    if (isLowPriority) lowPriority.push(message);
  }

  return {
    important,
    bills,
    lowPriority,
  };
}

function buildActions(
  messages: OutlookMessageSummary[],
  events: OutlookEventSummary[],
  bills: OutlookMessageSummary[],
  important: OutlookMessageSummary[],
  lowPriority: OutlookMessageSummary[],
  warnings: string[],
) {
  const actions: string[] = [];

  if (warnings.length > 0) {
    actions.push('Review Outlook connection permissions if some data is missing.');
  }

  if (important.length > 0) {
    actions.push(`Review ${important.length} important Outlook email${important.length === 1 ? '' : 's'}.`);
  }

  if (bills.length > 0) {
    actions.push(`Check ${bills.length} billing or payment related Outlook email${bills.length === 1 ? '' : 's'}.`);
  }

  if (events.length > 0) {
    actions.push(`Plan around ${events.length} upcoming Outlook calendar event${events.length === 1 ? '' : 's'}.`);
  }

  if (lowPriority.length > 0 && important.length === 0 && bills.length === 0) {
    actions.push('Most detected Outlook emails appear low priority.');
  }

  if (!actions.length && messages.length > 0) {
    actions.push('No urgent Outlook action found in the latest messages.');
  }

  return actions;
}

function buildInsight(
  messages: OutlookMessageSummary[],
  events: OutlookEventSummary[],
  important: OutlookMessageSummary[],
  bills: OutlookMessageSummary[],
  lowPriority: OutlookMessageSummary[],
  warnings: string[],
) {
  const parts: string[] = [];

  if (important.length > 0) parts.push(`${important.length} important email${important.length === 1 ? '' : 's'}`);
  if (bills.length > 0) parts.push(`${bills.length} billing/payment item${bills.length === 1 ? '' : 's'}`);
  if (events.length > 0) parts.push(`${events.length} upcoming calendar event${events.length === 1 ? '' : 's'}`);
  if (warnings.length > 0) parts.push(`${warnings.length} connection warning${warnings.length === 1 ? '' : 's'}`);

  return {
    title: 'Outlook smart scan',
    summary: parts.length
      ? `Found ${parts.join(', ')} from Outlook.`
      : `Scanned ${messages.length} Outlook email${messages.length === 1 ? '' : 's'} and found no obvious urgent items.`,
    counts: {
      messages: messages.length,
      events: events.length,
      important: important.length,
      bills: bills.length,
      lowPriority: lowPriority.length,
    },
  };
}

function mapGraphMessage(message: any): OutlookMessageSummary {
  return {
    subject: message.subject ?? '(No subject)',
    from:
      message.from?.emailAddress?.name ||
      message.from?.emailAddress?.address ||
      'Unknown sender',
    date: message.receivedDateTime,
    snippet: message.bodyPreview,
    importance: message.importance,
    isRead: message.isRead,
    webLink: message.webLink,
  };
}

function mapGraphEvent(event: any): OutlookEventSummary {
  return {
    subject: event.subject ?? '(No title)',
    start: event.start?.dateTime,
    end: event.end?.dateTime,
    location: event.location?.displayName,
    organizer:
      event.organizer?.emailAddress?.name ||
      event.organizer?.emailAddress?.address,
    webLink: event.webLink,
  };
}

async function fetchGraphJson(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message ?? 'Unknown Microsoft Graph error';
    throw new Error(`Microsoft Graph failed (${response.status}): ${message}`);
  }

  return data;
}

async function fetchOutlook(accessToken: string): Promise<OutlookFetchResult> {
  const now = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const mailUrl =
    'https://graph.microsoft.com/v1.0/me/messages' +
    '?$top=12' +
    '&$select=subject,from,receivedDateTime,bodyPreview,importance,isRead,webLink' +
    '&$orderby=receivedDateTime desc';

  const eventsUrl =
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(now.toISOString())}` +
    `&endDateTime=${encodeURIComponent(nextWeek.toISOString())}` +
    '&$top=12' +
    '&$select=subject,start,end,location,organizer,webLink' +
    '&$orderby=start/dateTime';

  const warnings: string[] = [];

  const [mailResult, calendarResult] = await Promise.allSettled([
    fetchGraphJson(mailUrl, accessToken),
    fetchGraphJson(eventsUrl, accessToken),
  ]);

  let messages: OutlookMessageSummary[] = [];
  let events: OutlookEventSummary[] = [];

  if (mailResult.status === 'fulfilled') {
    messages = (mailResult.value.value ?? []).map(mapGraphMessage);
  } else {
    warnings.push(mailResult.reason instanceof Error ? mailResult.reason.message : 'Outlook mail fetch failed.');
  }

  if (calendarResult.status === 'fulfilled') {
    events = (calendarResult.value.value ?? []).map(mapGraphEvent);
  } else {
    warnings.push(calendarResult.reason instanceof Error ? calendarResult.reason.message : 'Outlook calendar fetch failed.');
  }

  if (!messages.length && !events.length && warnings.length > 0) {
    throw new Error(warnings.join(' | '));
  }

  return {
    messages,
    events,
    warnings,
  };
}

async function fetchOutlookWithRefresh(integration: MicrosoftIntegration) {
  let accessToken = await getUsableAccessToken(integration);

  if (!accessToken) {
    await markNeedsReconnect(integration.id);
    throw new Error('Outlook reconnect required.');
  }

  try {
    return await fetchOutlook(accessToken);
  } catch (error) {
    if (!isAuthError(error)) throw error;

    accessToken = await refreshMicrosoftAccessToken(integration);

    if (!accessToken) {
      throw new Error('Outlook reconnect required.');
    }

    return await fetchOutlook(accessToken);
  }
}

function buildResult(fetchResult: OutlookFetchResult): OutlookToolResult {
  const { messages, events, warnings } = fetchResult;
  const { important, bills, lowPriority } = classifyMessages(messages);

  return {
    connected: true,
    messages,
    events,
    important,
    bills,
    lowPriority,
    warnings,
    actions: buildActions(messages, events, bills, important, lowPriority, warnings),
    insight: buildInsight(messages, events, important, bills, lowPriority, warnings),
  };
}

export async function runOutlookTool(userId?: string): Promise<OutlookToolResult> {
  if (!userId) {
    return {
      connected: false,
      messages: [],
      events: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: [],
      warnings: [],
      error: 'User is not signed in.',
    };
  }

  const integration = await findMicrosoftIntegration(userId);

  if (!integration?.access_token) {
    return {
      connected: false,
      messages: [],
      events: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: [],
      warnings: [],
      error: 'Outlook is not connected or does not have the required permissions.',
    };
  }

  try {
    const fetchResult = await fetchOutlookWithRefresh(integration);
    return buildResult(fetchResult);
  } catch (error) {
    if (isPermissionError(error)) {
      await markNeedsReconnect(integration.id);

      return {
        connected: true,
        messages: [],
        events: [],
        important: [],
        bills: [],
        lowPriority: [],
        actions: ['Reconnect Outlook with mail and calendar permissions.'],
        warnings: [],
        error: 'Outlook is connected, but the token does not have the required permissions.',
      };
    }

    if (isAuthError(error) || (error instanceof Error && error.message.includes('reconnect'))) {
      await markNeedsReconnect(integration.id);

      return {
        connected: true,
        messages: [],
        events: [],
        important: [],
        bills: [],
        lowPriority: [],
        actions: ['Reconnect Outlook.'],
        warnings: [],
        error: 'Outlook reconnect required.',
      };
    }

    return {
      connected: true,
      messages: [],
      events: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: ['Outlook scan failed. Try reconnecting if this continues.'],
      warnings: [],
      error: error instanceof Error ? error.message : 'Outlook failed.',
    };
  }
}

export function shouldRunOutlookTool(message: string) {
  const text = normalizeText(message);

  return [
    'outlook',
    'microsoft mail',
    'microsoft calendar',
    'microsoft email',
    'email',
    'mail',
    'inbox',
    'message',
    'messages',
    'calendar',
    'meeting',
    'event',
    'schedule',
    'invoice',
    'bill',
    'payment',
    'receipt',
    'subscription',
    'renewal',
    'important message',
    'unread',
  ].some((signal) => text.includes(signal));
}

export function formatOutlookForPrompt(result: OutlookToolResult) {
  if (!result.connected) {
    return [
      'Outlook tool: Outlook is not connected.',
      'Important: Do not claim that Outlook was checked.',
    ].join('\n');
  }

  if (result.error) {
    return [
      `Outlook tool error: ${result.error}`,
      'Important: Do not claim that Outlook was checked successfully.',
    ].join('\n');
  }

  const lines = [
    `Outlook tool: ${result.messages.length} recent email(s), ${result.events.length} upcoming event(s).`,
    `Important: ${result.important.length}. Bills/payments: ${result.bills.length}. Low priority: ${result.lowPriority.length}.`,
  ];

  if (result.warnings?.length) {
    lines.push(`Warnings: ${result.warnings.join(' | ')}`);
    lines.push('Important: Some Outlook data may be missing. Explain this carefully if relevant.');
  }

  if (result.insight?.summary) {
    lines.push(`Insight: ${result.insight.summary}`);
  }

  if (result.actions.length) {
    lines.push(`Suggested actions: ${result.actions.join(' | ')}`);
  }

  if (result.messages.length > 0) {
    lines.push('Recent Outlook emails:');

    lines.push(
      ...result.messages.slice(0, 8).map((message, index) => {
        const parts = [`${index + 1}. ${message.subject || '(No subject)'}`];

        if (message.from) parts.push(`from ${message.from}`);
        if (message.date) parts.push(`date ${message.date}`);
        if (message.importance) parts.push(`importance ${message.importance}`);
        if (message.snippet) parts.push(`snippet: ${message.snippet}`);

        return `- ${parts.join(' | ')}`;
      }),
    );
  }

  if (result.events.length > 0) {
    lines.push('Upcoming Outlook calendar events:');

    lines.push(
      ...result.events.slice(0, 8).map((event, index) => {
        const parts = [`${index + 1}. ${event.subject || '(No title)'}`];

        if (event.start) parts.push(`starts ${event.start}`);
        if (event.end) parts.push(`ends ${event.end}`);
        if (event.location) parts.push(`location ${event.location}`);
        if (event.organizer) parts.push(`organizer ${event.organizer}`);

        return `- ${parts.join(' | ')}`;
      }),
    );
  }

  if (!result.messages.length && !result.events.length) {
    lines.push('Outlook tool: Connected, but no recent Outlook emails or upcoming events were found.');
  }

  return lines.join('\n');
}
