import { createSupabaseServer } from '@/lib/supabase/server';
import { listGmailMessages, GmailMessageSummary } from '@/lib/integrations/google/gmail';

export type GmailToolResult = {
  connected: boolean;
  messages: GmailMessageSummary[];
  important: GmailMessageSummary[];
  bills: GmailMessageSummary[];
  error?: string;
};

function classifyMessages(messages: GmailMessageSummary[]) {
  const importantKeywords = ['invoice', 'bill', 'receipt', 'payment', 'subscription', 'renewal', 'lasku', 'maksu'];

  const important: GmailMessageSummary[] = [];
  const bills: GmailMessageSummary[] = [];

  for (const msg of messages) {
    const text = `${msg.subject} ${msg.snippet}`.toLowerCase();

    if (importantKeywords.some((k) => text.includes(k))) {
      important.push(msg);
    }

    if (text.includes('invoice') || text.includes('lasku') || text.includes('payment')) {
      bills.push(msg);
    }
  }

  return { important, bills };
}

export async function runGmailTool(userId?: string): Promise<GmailToolResult> {
  if (!userId) {
    return { connected: false, messages: [], important: [], bills: [], error: 'User not signed in' };
  }

  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .maybeSingle();

  if (!data?.access_token) {
    return { connected: false, messages: [], important: [], bills: [] };
  }

  try {
    const messages = await listGmailMessages(data.access_token);
    const { important, bills } = classifyMessages(messages);

    return { connected: true, messages, important, bills };
  } catch (e: any) {
    return { connected: true, messages: [], important: [], bills: [], error: e.message };
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
