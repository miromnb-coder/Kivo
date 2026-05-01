import { createSupabaseServer } from '@/lib/supabase/server';
import { listGmailMessages, GmailMessageSummary } from '@/lib/integrations/google/gmail';

export type GmailToolResult = {
  connected: boolean;
  messages: GmailMessageSummary[];
  important: GmailMessageSummary[];
  bills: GmailMessageSummary[];
  error?: string;
};

type GmailIntegration = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

function classifyMessages(messages: GmailMessageSummary[]) {
  const importantKeywords = ['invoice', 'bill', 'receipt', 'payment', 'subscription', 'renewal', 'lasku', 'maksu'];
  const billKeywords = ['invoice', 'bill', 'payment', 'lasku', 'maksu'];
  const important: GmailMessageSummary[] = [];
  const bills: GmailMessageSummary[] = [];

  for (const msg of messages) {
    const text = `${msg.subject} ${msg.snippet}`.toLowerCase();
    if (importantKeywords.some((word) => text.includes(word))) important.push(msg);
    if (billKeywords.some((word) => text.includes(word))) bills.push(msg);
  }

  return { important, bills };
}

function tokenNeedsRefresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

async function refreshGmailAccessToken(integration: GmailIntegration): Promise<string | null> {
  if (!integration.refresh_token) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || !tokenData.access_token) {
    return null;
  }

  const expiresAt = tokenData.expires_in
    ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
    : integration.expires_at;

  await createSupabaseServer()
    .from('kivo_integrations')
    .update({
      access_token: String(tokenData.access_token),
      expires_at: expiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  return String(tokenData.access_token);
}

async function getUsableGmailAccessToken(integration: GmailIntegration): Promise<string | null> {
  if (tokenNeedsRefresh(integration.expires_at)) {
    return refreshGmailAccessToken(integration);
  }

  return integration.access_token;
}

export async function runGmailTool(userId?: string): Promise<GmailToolResult> {
  if (!userId) {
    return { connected: false, messages: [], important: [], bills: [], error: 'User not signed in' };
  }

  const { data } = await createSupabaseServer()
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .maybeSingle();

  const integration = data as GmailIntegration | null;

  if (!integration?.access_token) {
    return { connected: false, messages: [], important: [], bills: [] };
  }

  try {
    let accessToken = await getUsableGmailAccessToken(integration);

    if (!accessToken) {
      return { connected: true, messages: [], important: [], bills: [], error: 'Gmail reconnect required.' };
    }

    try {
      const messages = await listGmailMessages(accessToken);
      const { important, bills } = classifyMessages(messages);
      return { connected: true, messages, important, bills };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('(401)')) {
        accessToken = await refreshGmailAccessToken(integration);

        if (!accessToken) {
          await createSupabaseServer()
            .from('kivo_integrations')
            .update({ status: 'needs_reconnect', updated_at: new Date().toISOString() })
            .eq('id', integration.id);

          return { connected: true, messages: [], important: [], bills: [], error: 'Gmail reconnect required.' };
        }

        const messages = await listGmailMessages(accessToken);
        const { important, bills } = classifyMessages(messages);
        return { connected: true, messages, important, bills };
      }

      throw error;
    }
  } catch (error) {
    return {
      connected: true,
      messages: [],
      important: [],
      bills: [],
      error: error instanceof Error ? error.message : 'Gmail failed.',
    };
  }
}

export function shouldRunGmailTool(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes('email') ||
    m.includes('sähköposti') ||
    m.includes('gmail') ||
    m.includes('lasku') ||
    m.includes('bill')
  );
}
