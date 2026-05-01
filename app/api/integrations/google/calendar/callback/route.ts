import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  return process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const baseUrl = getBaseUrl(req);

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/chat`);
  }

  const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString());

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

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

  const supabase = createSupabaseServer();

  await supabase.from('kivo_integrations').upsert({
    user_id: userId,
    provider: 'google_calendar',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });

  return NextResponse.redirect(`${baseUrl}/chat?connected=calendar`);
}
