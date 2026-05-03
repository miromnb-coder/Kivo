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
    return NextResponse.redirect(`${baseUrl}/chat?drive=missing_code`);
  }

  const userId = readUserIdFromState(state);

  if (!userId) {
    return NextResponse.redirect(`${baseUrl}/chat?drive=missing_user`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/chat?drive=missing_google_env`);
  }

  const redirectUri = `${baseUrl}/api/integrations/google/drive/callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

  const tokens = await tokenResponse.json();

  if (!tokenResponse.ok || !tokens.access_token) {
    return NextResponse.redirect(`${baseUrl}/chat?drive=token_failed`);
  }

  const supabase = createSupabaseServer();

  const { data: existing } = await supabase
    .from('kivo_integrations')
    .select('refresh_token')
    .eq('user_id', userId)
    .eq('provider', 'google_drive')
    .maybeSingle();

  const refreshToken = tokens.refresh_token ?? existing?.refresh_token ?? null;

  await supabase
    .from('kivo_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google_drive');

  const { error } = await supabase.from('kivo_integrations').insert({
    user_id: userId,
    provider: 'google_drive',
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    scopes: tokens.scope ? String(tokens.scope).split(' ') : [],
    expires_at: tokens.expires_in
      ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
      : null,
    status: refreshToken ? 'connected' : 'needs_reconnect',
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.redirect(`${baseUrl}/chat?drive=save_failed_${encodeURIComponent(error.code ?? 'unknown')}`);
  }

  return NextResponse.redirect(`${baseUrl}/chat?connected=drive`);
}
