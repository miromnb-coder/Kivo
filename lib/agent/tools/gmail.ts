import { createSupabaseServer } from '@/lib/supabase/server';
import { listGmailMessages } from '@/lib/integrations/google/gmail';

export async function runGmailTool(userId: string) {
  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .single();

  if (!data) {
    return { connected: false, messages: [] };
  }

  try {
    const messages = await listGmailMessages(data.access_token);
    return { connected: true, messages };
  } catch (e: any) {
    return { connected: true, error: e.message, messages: [] };
  }
}

export function shouldRunGmailTool(message: string) {
  const m = message.toLowerCase();
  return m.includes('email') || m.includes('sähköposti') || m.includes('gmail');
}
