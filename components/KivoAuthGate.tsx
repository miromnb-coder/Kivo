'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KivoAuthScreen } from './KivoAuthScreen';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function KivoAuthGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowser();

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        router.replace('/chat');
        return;
      }

      setChecking(false);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="relative grid h-[100dvh] place-items-center overflow-hidden bg-[#f4f4f6] text-[#202024]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_31%,#ffffff_0%,#f7f7f8_54%,#f0f0f2_100%)]" />
        <div className="relative text-[17px] tracking-[-0.025em] text-[#a4a5ab]">Loading Kivo…</div>
      </main>
    );
  }

  return <KivoAuthScreen />;
}
