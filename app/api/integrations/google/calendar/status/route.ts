import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const supabase = createSupabaseServer();

    const { data } = await supabase
      .from('kivo_integrations')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'google_calendar')
      .maybeSingle();

    return NextResponse.json({
      connected: Boolean(data?.id),
      expiresAt: data?.expires_at ?? null,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
