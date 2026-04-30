'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Eye, Lock, Mail, UserRound } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function KivoAuthScreen() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/chat');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#f4f4f6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_31%,#ffffff_0%,#f7f7f8_54%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-[430px] flex-col px-[41px] pt-[80px]">
        <h1 className="text-center text-[33px]">{isLogin ? 'Welcome back' : 'Create your account'}</h1>

        <div className="mt-[30px] space-y-[12px]">
          {!isLogin && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="h-[52px] rounded-[26px] px-[18px]" />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-[52px] rounded-[26px] px-[18px]" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="h-[52px] rounded-[26px] px-[18px]" />
        </div>

        {error && <p className="mt-[10px] text-red-500">{error}</p>}

        <button onClick={handleSubmit} disabled={loading} className="mt-[20px] h-[58px] rounded-[27px] bg-black text-white">
          {loading ? 'Loading...' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <button onClick={() => setIsLogin(!isLogin)} className="mt-[20px] text-center text-[#888]">
          {isLogin ? 'Create account' : 'Already have an account? Log in'}
        </button>
      </div>
    </main>
  );
}
