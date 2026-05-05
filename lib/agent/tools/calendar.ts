import { createSupabaseServer } from '@/lib/supabase/server';

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  htmlLink?: string;
};

export type CalendarTodayToolResult = {
  connected: boolean;
  events: CalendarEvent[];
  error?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
  location?: string;
  description?: string;
};

export type CalendarActionResult = {
  success: boolean;
  connected: boolean;
  action: 'create_event';
  event?: CalendarEvent;
  error?: string;
};

type CalendarIntegration = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

const GOOGLE_CALENDAR_PROVIDERS = ['google_calendar', 'google'];
const DEFAULT_TIME_ZONE = process.env.DEFAULT_TIMEZONE || 'UTC';

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

function hasCalendarMeaning(message: string) {
  const text = normalizeText(message);

  return [
    'calendar',
    'schedule',
    'event',
    'meeting',
    'availability',
    'free time',
    'appointment',
    'agenda',
    'today',
    'tomorrow',
  ].some((word) => text.includes(word));
}

function hasCreateMeaning(message: string) {
  const text = normalizeText(message);

  return [
    'add',
    'create',
    'schedule',
    'book',
    'insert',
    'put',
    'save',
    'make event',
    'new event',
  ].some((word) => text.includes(word));
}

export function shouldRunCalendarTodayTool(message: string) {
  return hasCalendarMeaning(message);
}

export function shouldRunCalendarCreateTool(message: string) {
  return hasCalendarMeaning(message) && hasCreateMeaning(message);
}

async function getUserTimeZone(userId: string) {
  const { data } = await createSupabaseServer()
    .from('kivo_profiles')
    .select('timezone')
    .eq('user_id', userId)
    .maybeSingle();

  return toText(data?.timezone) || DEFAULT_TIME_ZONE;
}

async function findCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
  const supabase = createSupabaseServer();

  const exact = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exact.data?.access_token) {
    return exact.data as CalendarIntegration;
  }

  const fallback = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .in('provider', GOOGLE_CALENDAR_PROVIDERS)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (fallback.data as CalendarIntegration | null) ?? null;
}

function shouldRefresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now() + 60_000;
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

async function refreshCalendarAccess(integration: CalendarIntegration): Promise<string | null> {
  if (!integration.refresh_token) {
    if (integration.expires_at && shouldRefresh(integration.expires_at)) {
      await markNeedsReconnect(integration.id);
      return null;
    }

    return integration.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return integration.access_token;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
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
      expires_at: expiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return String(tokenData.access_token);
}

async function getCalendarAccessToken(userId: string) {
  const integration = await findCalendarIntegration(userId);

  if (!integration?.access_token) {
    return {
      connected: false,
      accessToken: null,
      integration: null,
      error: 'Google Calendar is not connected.',
    };
  }

  const accessToken = shouldRefresh(integration.expires_at)
    ? await refreshCalendarAccess(integration)
    : integration.access_token;

  if (!accessToken) {
    return {
      connected: true,
      accessToken: null,
      integration,
      error: 'Google Calendar needs to be reconnected.',
    };
  }

  return {
    connected: true,
    accessToken,
    integration,
    error: undefined,
  };
}

function readGoogleEventTime(value: any) {
  return value?.dateTime || value?.date || '';
}

function mapGoogleEvent(event: any): CalendarEvent {
  return {
    id: String(event.id ?? ''),
    summary: event.summary || '(No title)',
    start: readGoogleEventTime(event.start),
    end: readGoogleEventTime(event.end),
    location: event.location || undefined,
    description: event.description || undefined,
    htmlLink: event.htmlLink || undefined,
  };
}

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
  };
}

function getDayRange(timeZone: string) {
  const now = new Date();
  const { year, month, day } = getTimeZoneDateParts(now, timeZone);

  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
  };
}

async function listCalendarEvents(accessToken: string, options: {
  timeMin: string;
  timeMax: string;
  timeZone: string;
  maxResults?: number;
}) {
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', options.timeMin);
  url.searchParams.set('timeMax', options.timeMax);
  url.searchParams.set('timeZone', options.timeZone);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', String(options.maxResults ?? 20));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Google Calendar list failed (${response.status}): ${data?.error?.message ?? 'Unknown error'}`);
  }

  return ((data.items ?? []) as any[]).map(mapGoogleEvent);
}

function hasExplicitOffset(value: string) {
  return /(?:z|[+-]\d{2}:\d{2})$/i.test(value);
}

function normalizeDateTimeForGoogle(value: string) {
  const clean = toText(value);

  if (!clean) return '';
  if (hasExplicitOffset(clean)) return clean;

  return clean.replace(/\s+/g, 'T');
}

function isValidDateTime(value: string) {
  const clean = normalizeDateTimeForGoogle(value);
  return Boolean(clean) && !Number.isNaN(Date.parse(clean));
}

function isEndAfterStart(startDateTime: string, endDateTime: string) {
  const start = Date.parse(normalizeDateTimeForGoogle(startDateTime));
  const end = Date.parse(normalizeDateTimeForGoogle(endDateTime));

  if (Number.isNaN(start) || Number.isNaN(end)) return true;

  return end > start;
}

async function createGoogleCalendarEvent(
  accessToken: string,
  input: CreateCalendarEventInput,
  fallbackTimeZone: string,
) {
  const timeZone = toText(input.timeZone) || fallbackTimeZone;
  const title = toText(input.title);
  const startDateTime = normalizeDateTimeForGoogle(input.startDateTime);
  const endDateTime = normalizeDateTimeForGoogle(input.endDateTime);

  if (!title) {
    throw new Error('Calendar event title is missing.');
  }

  if (!isValidDateTime(startDateTime) || !isValidDateTime(endDateTime)) {
    throw new Error('Calendar event start or end time is invalid.');
  }

  if (!isEndAfterStart(startDateTime, endDateTime)) {
    throw new Error('Calendar event end time must be after start time.');
  }

  const body = {
    summary: title,
    location: toText(input.location) || undefined,
    description: toText(input.description) || undefined,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Google Calendar create failed (${response.status}): ${data?.error?.message ?? 'Unknown error'}`);
  }

  return mapGoogleEvent(data);
}

export async function runCalendarTodayTool(userId?: string): Promise<CalendarTodayToolResult> {
  if (!userId) {
    return {
      connected: false,
      events: [],
      error: 'User is not signed in.',
    };
  }

  const token = await getCalendarAccessToken(userId);

  if (!token.connected || !token.accessToken) {
    return {
      connected: token.connected,
      events: [],
      error: token.error,
    };
  }

  try {
    const timeZone = await getUserTimeZone(userId);
    const range = getDayRange(timeZone);

    try {
      const events = await listCalendarEvents(token.accessToken, {
        ...range,
        timeZone,
      });

      return {
        connected: true,
        events,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('(401)') && token.integration) {
        const refreshedAccess = await refreshCalendarAccess(token.integration);

        if (!refreshedAccess) {
          return {
            connected: true,
            events: [],
            error: 'Google Calendar needs to be reconnected.',
          };
        }

        const events = await listCalendarEvents(refreshedAccess, {
          ...range,
          timeZone,
        });

        return {
          connected: true,
          events,
        };
      }

      throw error;
    }
  } catch (error) {
    return {
      connected: true,
      events: [],
      error: error instanceof Error ? error.message : 'Calendar tool failed.',
    };
  }
}

export async function createCalendarEventTool(
  userId: string | undefined,
  input: CreateCalendarEventInput,
): Promise<CalendarActionResult> {
  if (!userId) {
    return {
      success: false,
      connected: false,
      action: 'create_event',
      error: 'User is not signed in.',
    };
  }

  const token = await getCalendarAccessToken(userId);

  if (!token.connected || !token.accessToken) {
    return {
      success: false,
      connected: token.connected,
      action: 'create_event',
      error: token.error,
    };
  }

  try {
    const timeZone = toText(input.timeZone) || (await getUserTimeZone(userId));

    try {
      const event = await createGoogleCalendarEvent(token.accessToken, input, timeZone);

      return {
        success: true,
        connected: true,
        action: 'create_event',
        event,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('(401)') && token.integration) {
        const refreshedAccess = await refreshCalendarAccess(token.integration);

        if (!refreshedAccess) {
          return {
            success: false,
            connected: true,
            action: 'create_event',
            error: 'Google Calendar needs to be reconnected.',
          };
        }

        const event = await createGoogleCalendarEvent(refreshedAccess, input, timeZone);

        return {
          success: true,
          connected: true,
          action: 'create_event',
          event,
        };
      }

      throw error;
    }
  } catch (error) {
    return {
      success: false,
      connected: true,
      action: 'create_event',
      error: error instanceof Error ? error.message : 'Calendar create failed.',
    };
  }
}

export function formatCalendarTodayForPrompt(result: CalendarTodayToolResult) {
  if (!result.connected) {
    return [
      'Calendar tool: Google Calendar is not connected.',
      'Important: Do not claim that calendar data was checked.',
    ].join('\n');
  }

  if (result.error) {
    return [
      `Calendar tool error: ${result.error}`,
      'Important: Do not claim that calendar data was checked successfully.',
    ].join('\n');
  }

  if (result.events.length === 0) {
    return 'Calendar tool: User has no calendar events today.';
  }

  return [
    `Calendar tool: User has ${result.events.length} event(s) today.`,
    ...result.events.map((event) =>
      `- ${event.summary}: ${event.start} to ${event.end}${event.location ? ` at ${event.location}` : ''}`,
    ),
  ].join('\n');
}

export function formatCalendarActionForPrompt(result: CalendarActionResult) {
  if (!result.connected) {
    return [
      'Calendar action tool: Google Calendar is not connected.',
      'Important: The calendar action did not run. Do not claim that an event was created.',
    ].join('\n');
  }

  if (!result.success || !result.event) {
    return [
      `Calendar action tool failed: ${result.error ?? 'Unknown error.'}`,
      'Important: The event was not created. Do not claim that an event was added.',
    ].join('\n');
  }

  return [
    'Calendar action tool succeeded.',
    'Important: You may now accurately say that the event was added to the calendar.',
    `Created event: ${result.event.summary}`,
    `Start: ${result.event.start}`,
    `End: ${result.event.end}`,
    result.event.location ? `Location: ${result.event.location}` : '',
    result.event.htmlLink ? `Link: ${result.event.htmlLink}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
