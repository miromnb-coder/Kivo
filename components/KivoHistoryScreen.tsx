'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, MessageCircle, MoreVertical, Search, Sparkles, Trash2 } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoTopBar } from './KivoTopBar';

type ConversationRow = {
  id: string;
  title: string | null;
  updated_at: string;
  created_at?: string | null;
  is_favorite?: boolean | null;
  status?: string | null;
  preview?: string | null;
  last_role?: string | null;
};

type Group = {
  title: string;
  items: ConversationRow[];
};

function cleanPreview(value?: string | null) {
  const cleaned = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Open this conversation';
  return cleaned.length > 82 ? `${cleaned.slice(0, 82).trim()}…` : cleaned;
}

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays <= 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function createGroups(conversations: ConversationRow[]): Group[] {
  const now = new Date();
  const today: ConversationRow[] = [];
  const yesterday: ConversationRow[] = [];
  const week: ConversationRow[] = [];
  const older: ConversationRow[] = [];

  conversations.forEach((conversation) => {
    const date = new Date(conversation.updated_at);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const time = date.getTime();

    if (time >= startOfToday) today.push(conversation);
    else if (time >= startOfYesterday) yesterday.push(conversation);
    else if (now.getTime() - time < 7 * 86400000) week.push(conversation);
    else older.push(conversation);
  });

  return [
    { title: 'Today', items: today },
    { title: 'Yesterday', items: yesterday },
    { title: 'Previous 7 days', items: week },
    { title: 'Older', items: older },
  ].filter((group) => group.items.length > 0);
}

export function KivoHistoryScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadConversations() {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: conversationData } = await supabase
      .from('kivo_conversations')
      .select('id,title,updated_at,created_at,is_favorite,status')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(80);

    const rows = (conversationData ?? []) as ConversationRow[];

    const withPreviews = await Promise.all(
      rows.map(async (conversation) => {
        const { data: messageData } = await supabase
          .from('kivo_messages')
          .select('content,role,created_at')
          .eq('conversation_id', conversation.id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conversation,
          preview: messageData?.content ?? null,
          last_role: messageData?.role ?? null,
        };
      }),
    );

    setConversations(withPreviews);
    setLoading(false);
  }

  useEffect(() => {
    loadConversations();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const title = conversation.title?.toLowerCase() ?? '';
      const preview = conversation.preview?.toLowerCase() ?? '';
      return title.includes(q) || preview.includes(q);
    });
  }, [conversations, query]);

  const groups = useMemo(() => createGroups(filtered), [filtered]);

  function openConversation(conversationId: string) {
    router.push(`/chat?conversationId=${encodeURIComponent(conversationId)}`);
  }

  async function deleteConversation(conversationId: string) {
    const confirmed = window.confirm('Delete this conversation?');
    if (!confirmed) return;

    setDeletingId(conversationId);
    const supabase = createSupabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      setDeletingId(null);
      return;
    }

    await supabase.from('kivo_conversations').delete().eq('id', conversationId).eq('user_id', userId);
    setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
    setDeletingId(null);
  }

  function ConversationItem({ conversation }: { conversation: ConversationRow }) {
    return (
      <div className="group flex min-h-[76px] items-center gap-[13px] border-b border-black/[0.045] bg-white/72 px-[14px] py-[11px] last:border-b-0 transition active:scale-[0.997]">
        <button type="button" onClick={() => openConversation(conversation.id)} className="flex min-w-0 flex-1 items-center gap-[13px] text-left">
          <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-[#f2f2f3] text-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <MessageCircle size={20} strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-[7px]">
              <span className="truncate text-[15.5px] font-semibold tracking-[-0.035em] text-[#15161a]">
                {conversation.title || 'New conversation'}
              </span>
              {conversation.status === 'running' ? <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-[#202024]" /> : null}
            </span>
            <span className="mt-[4px] block truncate text-[13px] leading-[1.2] tracking-[-0.025em] text-[#70727a]">
              {cleanPreview(conversation.preview)}
            </span>
          </span>
          <span className="ml-[6px] shrink-0 text-[12.5px] font-medium tracking-[-0.02em] text-[#8c8e96]">
            {formatTime(conversation.updated_at)}
          </span>
        </button>

        <button
          type="button"
          aria-label="Delete conversation"
          disabled={deletingId === conversation.id}
          onClick={() => deleteConversation(conversation.id)}
          className="flex h-[34px] w-[28px] shrink-0 items-center justify-center rounded-full text-[#8c8e96] transition hover:bg-black/[0.04] hover:text-[#202024] active:scale-95 disabled:opacity-40"
        >
          {deletingId === conversation.id ? <MoreVertical size={18} /> : <Trash2 size={17} strokeWidth={1.9} />}
        </button>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5] text-[#202024]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />

      <div className="fixed left-1/2 top-0 z-50 w-full max-w-[430px] -translate-x-1/2">
        <KivoTopBar />
      </div>

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px] px-[28px] pb-[40px] pt-[126px]">
        <h1 className="text-[32px] font-semibold leading-none tracking-[-0.06em] text-[#15161a]">History</h1>

        <label className="mt-[28px] flex h-[48px] items-center gap-[11px] rounded-[24px] bg-white/80 px-[15px] shadow-[0_14px_34px_rgba(15,23,42,0.032)] ring-1 ring-black/[0.025] backdrop-blur-xl">
          <Search size={19} strokeWidth={1.9} className="text-[#8b8d94]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            className="min-w-0 flex-1 bg-transparent text-[15px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#9b9ca3]"
          />
        </label>

        {loading ? (
          <div className="mt-[34px] space-y-[12px]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[76px] animate-pulse rounded-[24px] bg-white/70" />
            ))}
          </div>
        ) : groups.length ? (
          <div className="mt-[30px] space-y-[28px]">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className="mb-[10px] text-[15px] font-medium tracking-[-0.03em] text-[#73747b]">{group.title}</h2>
                <div className="overflow-hidden rounded-[24px] bg-white/76 shadow-[0_14px_38px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.025] backdrop-blur-xl">
                  {group.items.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-[44px] rounded-[28px] bg-white/72 px-[22px] py-[28px] text-center shadow-[0_14px_38px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.025]">
            <div className="mx-auto flex h-[46px] w-[46px] items-center justify-center rounded-[16px] bg-[#f2f2f3] text-[#202024]">
              <Clock3 size={22} strokeWidth={1.9} />
            </div>
            <h2 className="mt-[14px] text-[18px] font-semibold tracking-[-0.04em] text-[#15161a]">No conversations found</h2>
            <p className="mt-[6px] text-[13.5px] leading-[1.35] tracking-[-0.025em] text-[#777981]">Your previous Kivo conversations will appear here.</p>
          </div>
        )}

        <p className="mt-[26px] text-center text-[12.5px] tracking-[-0.02em] text-[#8c8e96]">
          Conversations are private and secure.
        </p>
      </div>
    </main>
  );
}
