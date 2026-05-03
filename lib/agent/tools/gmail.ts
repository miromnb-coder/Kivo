import { createSupabaseServer } from '@/lib/supabase/server';
import { listGmailMessages, GmailMessageSummary } from '@/lib/integrations/google/gmail';

export type GmailToolResult = {
  connected: boolean;
  messages: GmailMessageSummary[];
  important: GmailMessageSummary[];
  bills: GmailMessageSummary[];
  lowPriority: GmailMessageSummary[];
  insight?: {
    title: string;
    summary: string;
    counts: {
      bills: number;
      important: number;
      lowPriority: number;
    };
  };
  error?: string;
};

type GmailIntegration = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

const GMAIL_PROVIDER_KEYS = ['gmail', 'google_gmail', 'google_mail', 'email'];

function classifyMessages(messages: GmailMessageSummary[]) {
  const importantKeywords = ['invoice', 'bill', 'receipt', 'payment', 'subscription', 'renewal', 'security', 'alert', 'verify', 'lasku', 'maksu', 'turvallisuus'];
  const billKeywords = ['invoice', 'bill', 'payment', 'receipt', 'subscription', 'renewal', 'lasku', 'maksu'];
  const lowPriorityKeywords = ['newsletter', 'credits', 'free credits', 'welcome', 'product update', 'contest', 'marketing', 'promo'];
  const important: GmailMessageSummary[] = [];
  const bills: GmailMessageSummary[] = [];
  const lowPriority: GmailMessageSummary[] = [];

  for (const msg of messages) {
    const text = `${msg.subject} ${msg.snippet} ${msg.from}`.toLowerCase();
    const isBill = billKeywords.some((word) => text.includes(word));
    const isImportant = importantKeywords.some((word) => text.includes(word));
    const isLowPriority = lowPriorityKeywords.some((word) => text.includes(word));

    if (isBill) bills.push(msg);
    if (isImportant) important.push(msg);
    if (!isBill && !isImportant && isLowPriority) lowPriority.push(msg);
  }

  return { important, bills, lowPriority };
}

function buildGmailInsight(messages: GmailMessageSummary[], important: GmailMessageSummary[], bills: GmailMessageSummary[], lowPriority: GmailMessageSummary[]) {
  const parts: string[] = [];

  if (bills.length > 0) parts.push(`${bills.length} laskuun tai maksuun liittyvää viestiä`);
  if (important.length > 0) parts.push(`${important.length} mahdollisesti tärkeää viestiä`);
  if (lowPriority.length > 0) parts.push(`${lowPriority.length} todennäköisesti matalan prioriteetin viestiä`);

  return {
    title: 'AI suodatus',
    summary: parts.length
      ? `Näistä ${messages.length} viimeisimmästä sähköpostista löysin ${parts.join(', ')}.`
      : `Näistä ${messages.length} viimeisimmästä sähköpostista ei löytynyt selviä laskuja tai kiireellisiä viestejä.`,
    counts: {
      bills: bills.length,
      important: important.length,
      lowPriority: lowPriority.length,
    },
  };
}

function tokenNeedsRefresh(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

async function findGmailIntegration(userId: string): Promise<GmailIntegration | null> {
  const supabase = createSupabaseServer();

  const exact = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .in('provider', GMAIL_PROVIDER_KEYS)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exact.data?.access_token) return exact.data as GmailIntegration;

  // Safe fallback for older Google connect flows that stored one shared Google row.
  // Calendar already has fallback behavior, but Gmail previously did not.
  const googleFallback = await supabase
    .from('kivo_integrations')
    .select('id, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (googleFallback.data as GmailIntegration | null) ?? null;
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

function buildResult(messages: GmailMessageSummary[]): GmailToolResult {
  const { important, bills, lowPriority } = classifyMessages(messages);
  return {
    connected: true,
    messages,
    important,
    bills,
    lowPriority,
    insight: buildGmailInsight(messages, important, bills, lowPriority),
  };
}

export async function runGmailTool(userId?: string): Promise<GmailToolResult> {
  if (!userId) {
    return { connected: false, messages: [], important: [], bills: [], lowPriority: [], error: 'User not signed in' };
  }

  const integration = await findGmailIntegration(userId);

  if (!integration?.access_token) {
    return { connected: false, messages: [], important: [], bills: [], lowPriority: [] };
  }

  try {
    let accessToken = await getUsableGmailAccessToken(integration);

    if (!accessToken) {
      return { connected: true, messages: [], important: [], bills: [], lowPriority: [], error: 'Gmail reconnect required.' };
    }

    try {
      const messages = await listGmailMessages(accessToken);
      return buildResult(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message.includes('(401)')) {
        accessToken = await refreshGmailAccessToken(integration);

        if (!accessToken) {
          await createSupabaseServer()
            .from('kivo_integrations')
            .update({ status: 'needs_reconnect', updated_at: new Date().toISOString() })
            .eq('id', integration.id);

          return { connected: true, messages: [], important: [], bills: [], lowPriority: [], error: 'Gmail reconnect required.' };
        }

        const messages = await listGmailMessages(accessToken);
        return buildResult(messages);
      }

      throw error;
    }
  } catch (error) {
    return {
      connected: true,
      messages: [],
      important: [],
      bills: [],
      lowPriority: [],
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
