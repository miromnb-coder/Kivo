import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const raw = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
  return raw.replace(/\/$/, '');
}

function readUserId(state: string | null) {
  if (!state) return null;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
    return typeof parsed.userId === 'string' && parsed.userId ? parsed.userId : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const baseUrl = getBaseUrl(req);
  const userId = readUserId(state);

  if (!code || !userId) {
    return NextResponse.redirect(`${baseUrl}/chat?gmail=missing_data`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/chat?gmail=missing_google_env`);
  }

  const redirectUri = `${baseUrl}/api/integrations/google/gmail/callback`;

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
    return NextResponse.redirect(`${baseUrl}/chat?gmail=token_failed`);
  }

  const supabase = createSupabaseServer();

  const { data: existing } = await supabase
    .from('kivo_integrations')
    .select('refresh_token')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .maybeSingle();

  const refreshToken = tokens.refresh_token ?? existing?.refresh_token ?? null;

  await supabase
    .from('kivo_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'gmail');

  const { error } = await supabase.from('kivo_integrations').insert({
    user_id: userId,
    provider: 'gmail',
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
    return NextResponse.redirect(`${baseUrl}/chat?gmail=save_failed_${encodeURIComponent(error.code ?? 'unknown')}`);
  }

  return NextResponse.redirect(`${baseUrl}/chat?connected=gmail`);
}
