import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MICROSOFT_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.Send',
  'Calendars.Read',
  'Calendars.ReadWrite',
];

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
  return rawBaseUrl.replace(/\/$/, '');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const clientId = process.env.OUTLOOK_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing OUTLOOK_CLIENT_ID' }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 401 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/integrations/microsoft/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');
  const tenant = process.env.OUTLOOK_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common';

  const authUrl = new URL(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', MICROSOFT_SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(authUrl.toString());
}
