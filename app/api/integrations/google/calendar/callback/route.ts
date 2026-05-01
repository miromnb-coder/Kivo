import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
  return rawBaseUrl.replace(/\/$/, '');
}

function readUserIdFromState(state: string | null) {
  if (!state) return null;

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    return typeof parsed.userId === 'string' && parsed.userId.length > 0 ? parsed.userId : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const baseUrl = getBaseUrl(req);

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/chat?calendar=missing_code`);
  }

  const userId = readUserIdFromState(state);

  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/chat?calendar=missing_user`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/chat?calendar=missing_google_env`);
  }

  const redirectUri = `${baseUrl}/api/integrations/google/calendar/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.redirect(`${baseUrl}/chat?calendar=token_failed`);
  }

  const supabase = createSupabaseServer();

  const { error } = await supabase.from('kivo_integrations').upsert(
    {
      user_id: userId,
      provider: 'google_calendar',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      scope: tokens.scope ?? null,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
        : null,
      status: 'connected',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' },
  );

  if (error) {
    return NextResponse.redirect(`${baseUrl}/chat?calendar=save_failed`);
  }

  return NextResponse.redirect(`${baseUrl}/chat?connected=calendar`);
}
