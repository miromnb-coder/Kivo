import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ConnectorId = 'google-drive' | 'gmail' | 'google-calendar' | 'outlook-calendar' | 'outlook-mail';

const providerAliases: Record<ConnectorId, string[]> = {
  'google-drive': ['google_drive', 'drive'],
  gmail: ['gmail', 'google_gmail'],
  'google-calendar': ['google_calendar', 'calendar'],
  'outlook-calendar': ['outlook_calendar', 'microsoft_outlook_calendar'],
  'outlook-mail': ['outlook_mail', 'microsoft_outlook_mail'],
};

function isConnectorId(value: string | null): value is ConnectorId {
  return value === 'google-drive' || value === 'gmail' || value === 'google-calendar' || value === 'outlook-calendar' || value === 'outlook-mail';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const connectorId = typeof body.connectorId === 'string' ? body.connectorId : null;

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 401 });
    }

    if (!isConnectorId(connectorId)) {
      return NextResponse.json({ ok: false, error: 'Unknown connector' }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const providers = providerAliases[connectorId];

    const { error } = await supabase
      .from('kivo_integrations')
      .delete()
      .eq('user_id', userId)
      .in('provider', providers);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, connected: false, connectorId });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
