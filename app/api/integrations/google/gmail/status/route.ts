import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_PROVIDER_KEYS = ['gmail', 'google_gmail', 'google_mail', 'email'];
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

function hasGmailScope(scopes: unknown) {
  if (Array.isArray(scopes)) {
    return scopes.some((scope) => String(scope).includes('gmail'));
  }

  if (typeof scopes === 'string') {
    return scopes.includes('gmail');
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const supabase = createSupabaseServer();

    const exact = await supabase
      .from('kivo_integrations')
      .select('id, expires_at, scopes, status')
      .eq('user_id', userId)
      .in('provider', GMAIL_PROVIDER_KEYS)
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exact.data?.id) {
      return NextResponse.json({
        connected: exact.data.status !== 'needs_reconnect',
        provider: 'gmail',
        expiresAt: exact.data.expires_at ?? null,
        requiredScope: GMAIL_SCOPE,
      });
    }

    const google = await supabase
      .from('kivo_integrations')
      .select('id, expires_at, scopes, status')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const googleHasGmail = Boolean(google.data?.id) && hasGmailScope(google.data?.scopes);

    return NextResponse.json({
      connected: googleHasGmail && google.data?.status !== 'needs_reconnect',
      provider: googleHasGmail ? 'google' : null,
      expiresAt: googleHasGmail ? google.data?.expires_at ?? null : null,
      requiredScope: GMAIL_SCOPE,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
