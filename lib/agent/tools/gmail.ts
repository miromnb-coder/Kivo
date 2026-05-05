import { createSupabaseServer } from '@/lib/supabase/server';
import { listGmailMessages, type GmailMessageSummary } from '@/lib/integrations/google/gmail';

export type GmailToolResult = {
  connected: boolean;
  messages: GmailMessageSummary[];
  important: GmailMessageSummary[];
  bills: GmailMessageSummary[];
  lowPriority: GmailMessageSummary[];
  actions: string[];
  insight?: {
    title: string;
    summary: string;
    counts: {
      messages: number;
      bills: number;
      important: number;
      lowPriority: number;
    };
  };
  error?: string;
};

type GmailIntegration = {
  id: string;
  provider?: string | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  scopes?: string[] | string | null;
  status?: string | null;
};

const GMAIL_PROVIDER_KEYS = ['gmail', 'google_gmail', 'google_mail', 'email'];
const GOOGLE_SHARED_PROVIDER_KEY = 'google';

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMessageText(message: GmailMessageSummary) {
  return normalizeText(`${message.subject ?? ''} ${message.snippet ?? ''} ${message.from ?? ''}`);
}

function scopesToText(scopes: unknown) {
  if (Array.isArray(scopes)) return scopes.map(String).join(' ').toLowerCase();
  if (typeof scopes === 'string') return scopes.toLowerCase();
  return '';
}

function hasKnownGmailScope(scopes: unknown) {
  const text = scopesToText(scopes);

  if (!text) return true;

  return (
    text.includes('gmail') ||
    text.includes('mail.google.com') ||
    text.includes('googleapis.com/auth/gmail.readonly') ||
    text.includes('googleapis.com/auth/gmail.modify')
  );
}

function isTokenExpiredSoon(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now() + 60_000;
}

function isAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('(401)') || message.includes('401') || message.toLowerCase().includes('unauthorized');
}

function isPermissionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    message.includes('(403)') ||
    message.includes('403') ||
    message.toLowerCase().includes('insufficient') ||
    message.toLowerCase().includes('permission') ||
    message.toLowerCase().includes('scope')
  );
}

function classifyMessages(messages: GmailMessageSummary[]) {
  const importantSignals = [
    'urgent',
    'important',
    'action required',
    'requires action',
    'security',
    'alert',
    'verification',
    'verify',
    'sign in',
    'login',
    'account',
    'deadline',
    'overdue',
    'failed payment',
    'payment failed',
    'unusual activity',
    'password',
  ];

  const billSignals = [
    'invoice',
    'bill',
    'billing',
    'payment',
    'receipt',
    'subscription',
    'renewal',
    'due',
    'order',
    'purchase',
    'charged',
    'charge',
    'refund',
    'bank',
    'statement',
  ];

  const lowPrioritySignals = [
    'newsletter',
    'marketing',
    'promo',
    'promotion',
    'discount',
    'sale',
    'welcome',
    'product update',
    'contest',
    'credits',
    'free credits',
    'digest',
    'weekly update',
  ];

  const important: GmailMessageSummary[] = [];
  const bills: GmailMessageSummary[] = [];
  const lowPriority: GmailMessageSummary[] = [];

  for (const message of messages) {
    const text = getMessageText(message);

    const isBill = billSignals.some((signal) => text.includes(signal));
    const isImportant = importantSignals.some((signal) => text.includes(signal)) || isBill;
    const isLowPriority = !isBill && !isImportant && lowPrioritySignals.some((signal) => text.includes(signal));

    if (isBill) bills.push(message);
    if (isImportant) important.push(message);
    if (isLowPriority) lowPriority.push(message);
  }

  return {
    important,
    bills,
    lowPriority,
  };
}

function buildGmailInsight(
  messages: GmailMessageSummary[],
  important: GmailMessageSummary[],
  bills: GmailMessageSummary[],
  lowPriority: GmailMessageSummary[],
) {
  const parts: string[] = [];

  if (important.length > 0) parts.push(`${important.length} important message${important.length === 1 ? '' : 's'}`);
  if (bills.length > 0) parts.push(`${bills.length} billing/payment item${bills.length === 1 ? '' : 's'}`);
  if (lowPriority.length > 0) parts.push(`${lowPriority.length} low-priority message${lowPriority.length === 1 ? '' : 's'}`);

  return {
    title: 'Gmail smart scan',
    summary: parts.length
      ? `Found ${parts.join(', ')} from ${messages.length} recent Gmail message${messages.length === 1 ? '' : 's'}.`
      : `Scanned ${messages.length} recent Gmail message${messages.length === 1 ? '' : 's'} and found no obvious urgent items.`,
    counts: {
      messages: messages.length,
      bills: bills.length,
      important: important.length,
      lowPriority: lowPriority.length,
    },
  };
}

function buildActions(
  messages: GmailMessageSummary[],
  important: GmailMessageSummary[],
  bills: GmailMessageSummary[],
  lowPriority: GmailMessageSummary[],
) {
  const actions: string[] = [];

  if (important.length > 0) {
    actions.push(`Review ${important.length} important Gmail message${important.length === 1 ? '' : 's'}.`);
  }

  if (bills.length > 0) {
    actions.push(`Check ${bills.length} billing or payment related Gmail message${bills.length === 1 ? '' : 's'}.`);
  }

  if (lowPriority.length > 0 && important.length === 0 && bills.length === 0) {
    actions.push('Most detected Gmail items appear low priority.');
  }

  if (!actions.length && messages.length > 0) {
    actions.push('No urgent Gmail action found in the latest messages.');
  }

  return actions;
}

function buildResult(messages: GmailMessageSummary[]): GmailToolResult {
  const { important, bills, lowPriority } = classifyMessages(messages);

  return {
    connected: true,
    messages,
    important,
    bills,
    lowPriority,
    actions: buildActions(messages, important, bills, lowPriority),
    insight: buildGmailInsight(messages, important, bills, lowPriority),
  };
}

async function markNeedsReconnect(integrationId: string) {
  await createSupabaseServer()
    .from('kivo_integrations')
    .update({
      status: 'needs_reconnect',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);
}

async function findGmailIntegration(userId: string): Promise<GmailIntegration | null> {
  const supabase = createSupabaseServer();

  const exact = await supabase
    .from('kivo_integrations')
    .select('id, provider, access_token, refresh_token, expires_at, scopes, status')
    .eq('user_id', userId)
    .in('provider', GMAIL_PROVIDER_KEYS)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (exact.data?.access_token && hasKnownGmailScope(exact.data.scopes)) {
    return exact.data as GmailIntegration;
  }

  const sharedGoogle = await supabase
    .from('kivo_integrations')
    .select('id, provider, access_token, refresh_token, expires_at, scopes, status')
    .eq('user_id', userId)
    .eq('provider', GOOGLE_SHARED_PROVIDER_KEY)
    .not('access_token', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sharedGoogle.data?.access_token && hasKnownGmailScope(sharedGoogle.data.scopes)) {
    return sharedGoogle.data as GmailIntegration;
  }

  return null;
}

async function refreshGmailAccessToken(integration: GmailIntegration): Promise<string | null> {
  if (!integration.refresh_token) {
    if (integration.expires_at && isTokenExpiredSoon(integration.expires_at)) {
      await markNeedsReconnect(integration.id);
      return null;
    }

    return integration.access_token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return integration.access_token;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || !tokenData.access_token) {
    await markNeedsReconnect(integration.id);
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
  if (isTokenExpiredSoon(integration.expires_at)) {
    return refreshGmailAccessToken(integration);
  }

  return integration.access_token;
}

async function readGmailWithRefresh(integration: GmailIntegration) {
  let accessToken = await getUsableGmailAccessToken(integration);

  if (!accessToken) {
    await markNeedsReconnect(integration.id);
    throw new Error('Gmail reconnect required.');
  }

  try {
    return await listGmailMessages(accessToken);
  } catch (error) {
    if (!isAuthError(error)) throw error;

    accessToken = await refreshGmailAccessToken(integration);

    if (!accessToken) {
      throw new Error('Gmail reconnect required.');
    }

    return await listGmailMessages(accessToken);
  }
}

export async function runGmailTool(userId?: string): Promise<GmailToolResult> {
  if (!userId) {
    return {
      connected: false,
      messages: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: [],
      error: 'User is not signed in.',
    };
  }

  const integration = await findGmailIntegration(userId);

  if (!integration?.access_token) {
    return {
      connected: false,
      messages: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: [],
      error: 'Gmail is not connected or does not have Gmail read permission.',
    };
  }

  try {
    const messages = await readGmailWithRefresh(integration);
    return buildResult(messages);
  } catch (error) {
    if (isPermissionError(error)) {
      await markNeedsReconnect(integration.id);

      return {
        connected: true,
        messages: [],
        important: [],
        bills: [],
        lowPriority: [],
        actions: ['Reconnect Gmail with mail read permission.'],
        error: 'Gmail is connected, but the token does not have Gmail read permission.',
      };
    }

    if (isAuthError(error) || (error instanceof Error && error.message.includes('reconnect'))) {
      await markNeedsReconnect(integration.id);

      return {
        connected: true,
        messages: [],
        important: [],
        bills: [],
        lowPriority: [],
        actions: ['Reconnect Gmail.'],
        error: 'Gmail reconnect required.',
      };
    }

    return {
      connected: true,
      messages: [],
      important: [],
      bills: [],
      lowPriority: [],
      actions: ['Gmail scan failed. Try reconnecting if this continues.'],
      error: error instanceof Error ? error.message : 'Gmail failed.',
    };
  }
}

export function shouldRunGmailTool(message: string) {
  const text = normalizeText(message);

  return [
    'gmail',
    'email',
    'mail',
    'inbox',
    'message',
    'messages',
    'invoice',
    'bill',
    'payment',
    'receipt',
    'subscription',
    'renewal',
    'important message',
    'unread',
  ].some((signal) => text.includes(signal));
}

export function formatGmailForPrompt(result: GmailToolResult) {
  if (!result.connected) {
    return [
      'Gmail tool: Gmail is not connected.',
      'Important: Do not claim that Gmail was checked.',
    ].join('\n');
  }

  if (result.error) {
    return [
      `Gmail tool error: ${result.error}`,
      'Important: Do not claim that Gmail was checked successfully.',
    ].join('\n');
  }

  if (!result.messages.length) {
    return 'Gmail tool: Connected, but no recent Gmail messages were found.';
  }

  const lines = [
    `Gmail tool: ${result.messages.length} recent message(s).`,
    `Important: ${result.important.length}. Bills/payments: ${result.bills.length}. Low priority: ${result.lowPriority.length}.`,
  ];

  if (result.insight?.summary) {
    lines.push(`Insight: ${result.insight.summary}`);
  }

  if (result.actions.length) {
    lines.push(`Suggested actions: ${result.actions.join(' | ')}`);
  }

  lines.push('Recent Gmail messages:');

  lines.push(
    ...result.messages.slice(0, 8).map((message, index) => {
      const parts = [`${index + 1}. ${message.subject || '(No subject)'}`];

      if (message.from) parts.push(`from ${message.from}`);
      if (message.date) parts.push(`date ${message.date}`);
      if (message.snippet) parts.push(`snippet: ${message.snippet}`);

      return `- ${parts.join(' | ')}`;
    }),
  );

  return lines.join('\n');
}
