import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DRIVE_PROVIDER_KEYS = ['google_drive', 'drive'];
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function hasDriveScope(scopes: unknown) {
  if (Array.isArray(scopes)) {
    return scopes.some((scope) => String(scope).includes('/auth/drive'));
  }

  if (typeof scopes === 'string') {
    return scopes.includes('/auth/drive');
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
      .in('provider', DRIVE_PROVIDER_KEYS)
      .not('access_token', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (exact.data?.id) {
      return NextResponse.json({
        connected: exact.data.status !== 'needs_reconnect',
        provider: 'google_drive',
        expiresAt: exact.data.expires_at ?? null,
        requiredScope: DRIVE_SCOPE,
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

    const googleHasDrive = Boolean(google.data?.id) && hasDriveScope(google.data?.scopes);

    return NextResponse.json({
      connected: googleHasDrive && google.data?.status !== 'needs_reconnect',
      provider: googleHasDrive ? 'google' : null,
      expiresAt: googleHasDrive ? google.data?.expires_at ?? null : null,
      requiredScope: DRIVE_SCOPE,
    });
  } catch {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
