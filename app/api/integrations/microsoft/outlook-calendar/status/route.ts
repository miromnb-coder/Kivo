import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OUTLOOK_CALENDAR_PROVIDERS = ['outlook_calendar', 'microsoft_outlook_calendar', 'microsoft'];

function hasCalendarScope(scopes: unknown) {
  if (Array.isArray(scopes)) return scopes.some((scope) => String(scope).toLowerCase().includes('calendar'));
  if (typeof scopes === 'string') return scopes.toLowerCase().includes('calendar');
  return true;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) return NextResponse.json({ connected: false }, { status: 200 });

    const supabase = createSupabaseServer();
    const { data } = await supabase
      .from('kivo_integrations')
      .select('id, expires_at, status, scopes, provider')
      .eq('user_id', userId)
      .in('provider', OUTLOOK_CALENDAR_PROVIDERS)
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const connected = Boolean(data?.id) && data?.status !== 'needs_reconnect' && data?.status !== 'error' && hasCalendarScope(data?.scopes);

    return NextResponse.json({
      connected,
      provider: connected ? data?.provider ?? 'microsoft' : null,
      expiresAt: connected ? data?.expires_at ?? null : null,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
