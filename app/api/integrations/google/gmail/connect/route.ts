import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
  return rawBaseUrl.replace(/\/$/, '');
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 401 });
  }

  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/integrations/google/gmail/callback`;
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64url');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('scope', GMAIL_SCOPES.join(' '));
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
