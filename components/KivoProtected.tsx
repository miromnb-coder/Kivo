'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function KivoProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createSupabaseBrowser();

    async function check() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace('/');
        return;
      }

      setAllowed(true);
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!allowed) {
    return (
      <main className="grid h-[100dvh] place-items-center bg-[#f4f4f6]">
        <div className="text-[#a4a5ab]">Loading…</div>
      </main>
    );
  }

  return <>{children}</>;
}
