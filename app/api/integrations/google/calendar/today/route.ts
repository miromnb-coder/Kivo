import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { listGoogleCalendarToday } from '@/lib/integrations/google/calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createSupabaseServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: integration } = await supabase
      .from('kivo_integrations')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    if (!integration?.access_token) {
      return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
    }

    const events = await listGoogleCalendarToday(integration.access_token);

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
  }
}
