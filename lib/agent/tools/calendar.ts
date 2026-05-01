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

export function shouldRunCalendarTodayTool(message: string) {
  const text = message.toLowerCase();

  return ['calendar', 'kalenteri', 'today', 'tänään', 'tanaan', 'schedule', 'aikataulu', 'event', 'tapahtuma', 'meeting', 'kokous'].some((word) =>
    text.includes(word),
  );
}

export async function runCalendarTodayTool(userId?: string): Promise<CalendarTodayToolResult> {
  if (!userId) {
    return { connected: false, events: [], error: 'User is not signed in.' };
  }

  const supabase = createSupabaseServer();

  const { data: integration } = await supabase
    .from('kivo_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'google_calendar')
    .maybeSingle();

  if (!integration?.access_token) {
    return { connected: false, events: [], error: 'Google Calendar is not connected.' };
  }

  try {
    const events = await listGoogleCalendarToday(integration.access_token);
    return { connected: true, events };
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
