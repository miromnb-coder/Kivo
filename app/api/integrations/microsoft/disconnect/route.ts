import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    const userId = body.userId?.trim();

    if (!userId) {
      return NextResponse.json({ ok: false, connected: false, error: 'Missing userId' }, { status: 400 });
    }

    const supabase = createSupabaseServer();

    const { error } = await supabase
      .from('kivo_integrations')
      .delete()
      .eq('user_id', userId)
      .in('provider', ['microsoft', 'outlook_mail', 'outlook_calendar', 'microsoft_outlook_mail', 'microsoft_outlook_calendar']);

    if (error) {
      return NextResponse.json({ ok: false, connected: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, connected: false });
  } catch (error) {
    return NextResponse.json({ ok: false, connected: false, error: error instanceof Error ? error.message : 'Disconnect failed' }, { status: 500 });
  }
}
