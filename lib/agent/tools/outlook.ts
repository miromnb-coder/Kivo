import { createSupabaseServer } from '@/lib/supabase/server';

export async function runOutlookTool(userId: string) {
  const supabase = createSupabaseServer();

  const { data } = await supabase
    .from('kivo_integrations')
    .select('access_token')
    .eq('user_id', userId)
    .eq('provider', 'microsoft')
    .maybeSingle();

  if (!data?.access_token) {
    return { connected: false, messages: [], events: [] };
  }

  const headers = {
    Authorization: `Bearer ${data.access_token}`,
  };

  const [mailRes, calRes] = await Promise.all([
    fetch('https://graph.microsoft.com/v1.0/me/messages?$top=5', { headers }),
    fetch('https://graph.microsoft.com/v1.0/me/events?$top=5', { headers }),
  ]);

  const mailJson = await mailRes.json();
  const calJson = await calRes.json();

  return {
    connected: true,
    messages: (mailJson.value || []).map((m: any) => ({ subject: m.subject, from: m.from?.emailAddress?.address })),
    events: (calJson.value || []).map((e: any) => ({ subject: e.subject, start: e.start?.dateTime })),
  };
}
