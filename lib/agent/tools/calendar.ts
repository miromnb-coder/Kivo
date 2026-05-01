import { createSupabaseServer } from '@/lib/supabase/server';
import { listGoogleCalendarToday } from '@/lib/integrations/google/calendar';

export type CalendarTodayToolResult = {
  connected: boolean;
  events: Array<{
    id: string;
    summary: string;
    start: string;
    end: string;
    location?: string;
  }>;
  error?: string;
};

type CalendarIntegration = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

export function shouldRunCalendarTodayTool(message: string) {
  const text = message.toLowerCase();

  return ['calendar', 'kalenteri', 'today', 'tänään', 'tanaan', 'schedule', 'aikataulu', 'event', 'tapahtuma', 'meeting', 'kokous', 'päivä', 'paiva', 'vapaa', 'free time'].some((word) =>
    text.includes(word),
  );
}

async function findCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
  const supabase = createSupabaseServer();

  const exact = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .maybeSingle();

  if (exact.data?.access_token) return exact.data as CalendarIntegration;

  const fallback = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('provider', 'google_calendar')
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

async function refreshCalendarAccess(integration: CalendarIntegration) {
  if (!integration.refresh_token) return integration.access_token;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return integration.access_token;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return integration.access_token;

  const expiresAt = data.expires_in
    ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString()
    : integration.expires_at;

  await createSupabaseServer()
    .from('kivo_integrations')
    .update({
      access_token: data.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return data.access_token as string;
}

export async function runCalendarTodayTool(userId?: string): Promise<CalendarTodayToolResult> {
  if (!userId) {
    return { connected: false, events: [], error: 'User is not signed in.' };
  }

  const integration = await findCalendarIntegration(userId);

  if (!integration?.access_token) {
    return { connected: false, events: [], error: 'Google Calendar is not connected.' };
  }

  try {
    let access = shouldRefresh(integration.expires_at)
      ? await refreshCalendarAccess(integration)
      : integration.access_token;

    try {
      const events = await listGoogleCalendarToday(access);
      return { connected: true, events };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('(401)')) {
        access = await refreshCalendarAccess(integration);
        const events = await listGoogleCalendarToday(access);
        return { connected: true, events };
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

export function formatCalendarTodayForPrompt(result: CalendarTodayToolResult) {
  if (!result.connected) return 'Calendar tool: Google Calendar is not connected.';
  if (result.error) return `Calendar tool error: ${result.error}`;
  if (result.events.length === 0) return 'Calendar tool: User has no calendar events today.';

  return [
    `Calendar tool: User has ${result.events.length} event(s) today.`,
    ...result.events.map((event) => `- ${event.summary}: ${event.start} to ${event.end}${event.location ? ` at ${event.location}` : ''}`),
  ].join('\n');
}
