'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoTopBar } from './KivoTopBar';

function groupByDate(conversations: any[]) {
  const today: any[] = [];
  const yesterday: any[] = [];
  const week: any[] = [];

  const now = new Date();

  conversations.forEach((c) => {
    const date = new Date(c.updated_at);
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diff < 1) today.push(c);
    else if (diff < 2) yesterday.push(c);
    else week.push(c);
  });

  return { today, yesterday, week };
}

export function KivoHistoryScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from('kivo_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      setConversations(data || []);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    return conversations.filter((c) =>
      c.title?.toLowerCase().includes(query.toLowerCase())
    );
  }, [conversations, query]);

  const { today, yesterday, week } = useMemo(() => groupByDate(filtered), [filtered]);

  function Item({ c }: any) {
    return (
      <div className="flex items-center gap-[12px] rounded-[18px] bg-white px-[14px] py-[12px] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
        <div className="h-[36px] w-[36px] rounded-full bg-[#f2f2f3] flex items-center justify-center">💬</div>
        <div className="flex-1">
          <div className="text-[15px] font-medium text-[#202024]">{c.title}</div>
          <div className="text-[13px] text-[#8b8c92] truncate">Last updated</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f5]">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
        <KivoTopBar />
      </div>

      <div className="pt-[100px] px-[18px] pb-[40px] max-w-[430px] mx-auto">
        <h1 className="text-[28px] font-semibold text-[#202024] mb-[16px]">History</h1>

        <input
          placeholder="Search conversations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-[20px] h-[44px] px-[14px] rounded-[22px] bg-white outline-none"
        />

        {today.length > 0 && (
          <section className="mb-[20px]">
            <div className="text-[13px] text-[#8b8c92] mb-[10px]">Today</div>
            <div className="space-y-[8px]">{today.map((c) => <Item key={c.id} c={c} />)}</div>
          </section>
        )}

        {yesterday.length > 0 && (
          <section className="mb-[20px]">
            <div className="text-[13px] text-[#8b8c92] mb-[10px]">Yesterday</div>
            <div className="space-y-[8px]">{yesterday.map((c) => <Item key={c.id} c={c} />)}</div>
          </section>
        )}

        {week.length > 0 && (
          <section>
            <div className="text-[13px] text-[#8b8c92] mb-[10px]">Previous 7 days</div>
            <div className="space-y-[8px]">{week.map((c) => <Item key={c.id} c={c} />)}</div>
          </section>
        )}
      </div>
    </main>
  );
}
