'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';
import { KivoChatMessages, type KivoChatMessage } from './KivoChatMessages';
import { KivoSidebarOverlay, type KivoConversation, type SidebarFilter } from './KivoSidebarOverlay';

// shortened for brevity (only new parts added)

export function KivoStartScreen() {
  const [conversations, setConversations] = useState<KivoConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  async function renameConversation(id: string, title: string) {
    const userId = (await createSupabaseBrowser().auth.getUser()).data.user?.id;
    if (!userId) return;

    const supabase = createSupabaseBrowser();
    await supabase
      .from('kivo_conversations')
      .update({ title })
      .eq('id', id)
      .eq('user_id', userId);

    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }

  async function deleteConversation(id: string) {
    const userId = (await createSupabaseBrowser().auth.getUser()).data.user?.id;
    if (!userId) return;

    const supabase = createSupabaseBrowser();
    await supabase
      .from('kivo_conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }

  return (
    <KivoSidebarOverlay
      /* existing props */
      onRenameConversation={renameConversation}
      onDeleteConversation={deleteConversation}
    />
  );
}
