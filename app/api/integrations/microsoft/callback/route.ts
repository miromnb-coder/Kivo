import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) return NextResponse.redirect('/');

  const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString());

  const tokenRes = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft/callback`,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();

  const supabase = createSupabaseServer();

  await supabase.from('kivo_integrations').upsert({
    user_id: userId,
    provider: 'microsoft',
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    status: 'active',
  });

  return NextResponse.redirect('/');
}
