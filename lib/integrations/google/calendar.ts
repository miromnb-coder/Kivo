export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
};

const DEFAULT_TIMEZONE = 'Europe/Helsinki';

function localDateKey(date: Date, timeZone = DEFAULT_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function eventTouchesDate(item: any, dateKey: string, timeZone = DEFAULT_TIMEZONE) {
  const startValue = item.start?.dateTime ?? item.start?.date;
  const endValue = item.end?.dateTime ?? item.end?.date;

  if (!startValue) return false;

  if (item.start?.date) {
    return startValue <= dateKey && (!endValue || endValue > dateKey);
  }

  const startKey = localDateKey(new Date(startValue), timeZone);
  const endKey = endValue ? localDateKey(new Date(endValue), timeZone) : startKey;

  return startKey === dateKey || endKey === dateKey;
}

export async function listGoogleCalendarToday(accessToken: string, timeZone = DEFAULT_TIMEZONE): Promise<GoogleCalendarEvent[]> {
  const now = new Date();
  const todayKey = localDateKey(now, timeZone);

  // Query a wider window and then filter by local day. This avoids server timezone / DST bugs on Vercel.
  const timeMin = new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(now.getTime() + 42 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin,
    timeMax,
    timeZone,
    maxResults: '50',
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar request failed (${res.status})`);
  }

  const data = await res.json();

  return (data.items ?? [])
    .filter((item: any) => eventTouchesDate(item, todayKey, timeZone))
    .map((item: any) => ({
      id: item.id,
      summary: item.summary ?? 'Untitled event',
      start: item.start?.dateTime ?? item.start?.date ?? '',
      end: item.end?.dateTime ?? item.end?.date ?? '',
      location: item.location,
      description: item.description,
    }));
}
