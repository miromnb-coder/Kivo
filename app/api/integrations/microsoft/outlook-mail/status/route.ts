import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OUTLOOK_MAIL_PROVIDERS = ['outlook_mail', 'microsoft_outlook_mail'];

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
      .select('id, expires_at, status')
      .eq('user_id', userId)
      .in('provider', OUTLOOK_MAIL_PROVIDERS)
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      connected: Boolean(data?.id) && data?.status !== 'needs_reconnect',
      provider: data?.id ? 'outlook_mail' : null,
      expiresAt: data?.expires_at ?? null,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
