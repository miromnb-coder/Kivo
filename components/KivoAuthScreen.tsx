'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

type AuthInputProps = {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  autoComplete?: string;
};

function AuthInput({ icon, placeholder, value, onChange, type = 'text', rightIcon, onRightIconClick, autoComplete }: AuthInputProps) {
  return (
    <div className="flex h-[52px] items-center rounded-[26px] border border-[#ececef] bg-white/40 px-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.02)] backdrop-blur-[14px]">
      <div className="flex h-[24px] w-[24px] items-center justify-center text-[#1f2023]">{icon}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="ml-[17px] h-full flex-1 bg-transparent text-[17px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#a4a5ab]"
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
      />
      {rightIcon ? (
        <button type="button" onClick={onRightIconClick} className="ml-[12px] text-[#a9aab0]" aria-label="Toggle password visibility">
          {rightIcon}
        </button>
      ) : null}
    </div>
  );
}

export function KivoAuthScreen() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit() {
    if (loading) return;

    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Add your email and password.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
          },
        });
        if (error) throw error;
      }

      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/chat` : undefined,
      },
    });

    if (error) setError(error.message);
  }

  function toggleMode() {
    setError(null);
    setIsLogin((current) => !current);
  }

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#f4f4f6] text-[#202024]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_31%,#ffffff_0%,#f7f7f8_54%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col px-[41px] pt-[calc(env(safe-area-inset-top)+31px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <button className="absolute left-[24px] top-[calc(env(safe-area-inset-top)+22px)] flex h-[42px] w-[42px] items-center justify-center text-[#202024]" aria-label="Back">
          <ChevronLeft size={25} strokeWidth={2.1} />
        </button>

        <section className="pt-[92px] text-center">
          <h1 className="text-[33px] font-normal leading-[1.08] tracking-[-0.055em] text-[#17181b]">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mx-auto mt-[18px] max-w-[250px] text-[17px] leading-[1.45] tracking-[-0.03em] text-[#9d9ea5]">
            {isLogin ? (
              <>
                Log in to continue to your<br />personal AI assistant.
              </>
            ) : (
              <>
                Join Kivo and get your<br />personal AI assistant.
              </>
            )}
          </p>
        </section>

        <section className="mt-[44px] space-y-[10px]">
          {!isLogin ? (
            <AuthInput icon={<UserRound size={19} strokeWidth={1.9} />} placeholder="Full name" value={name} onChange={setName} autoComplete="name" />
          ) : null}
          <AuthInput icon={<Mail size={19} strokeWidth={1.9} />} placeholder="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <AuthInput
            icon={<Lock size={18} strokeWidth={2} />}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            type={showPassword ? 'text' : 'password'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            rightIcon={showPassword ? <EyeOff size={21} strokeWidth={1.9} /> : <Eye size={21} strokeWidth={1.9} />}
            onRightIconClick={() => setShowPassword((current) => !current)}
          />
          {!isLogin ? (
            <AuthInput
              icon={<Lock size={18} strokeWidth={2} />}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              rightIcon={showConfirmPassword ? <EyeOff size={21} strokeWidth={1.9} /> : <Eye size={21} strokeWidth={1.9} />}
              onRightIconClick={() => setShowConfirmPassword((current) => !current)}
            />
          ) : null}
        </section>

        {error ? (
          <div className="mt-[10px] rounded-[18px] border border-[#f0d6d6] bg-white/55 px-[14px] py-[9px] text-center text-[13px] leading-[1.25] tracking-[-0.02em] text-[#9b3b3b] backdrop-blur-[14px]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-[18px] flex h-[58px] items-center justify-center rounded-[27px] bg-[#111113] px-[22px] text-[18px] font-medium tracking-[-0.03em] text-white shadow-[0_16px_34px_rgba(0,0,0,0.12)] disabled:opacity-70"
        >
          <span className="flex-1 text-center">{loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</span>
          <ArrowRight size={24} strokeWidth={1.8} />
        </button>

        <div className="mt-[23px] flex items-center gap-[18px] px-[14px]">
          <div className="h-px flex-1 bg-[#e7e7ea]" />
          <span className="text-[15px] tracking-[-0.025em] text-[#aeb0b6]">Or continue with</span>
          <div className="h-px flex-1 bg-[#e7e7ea]" />
        </div>

        <section className="mt-[15px] space-y-[11px]">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex h-[54px] w-full items-center justify-center rounded-[27px] border border-[#ededf0] bg-white/50 text-[17px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_4px_14px_rgba(15,23,42,0.015)] backdrop-blur-[14px]"
          >
            <span className="mr-[22px] flex h-[20px] w-[20px] items-center justify-center"><GoogleIcon /></span>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="flex h-[54px] w-full items-center justify-center rounded-[27px] border border-[#ededf0] bg-white/50 text-[17px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_4px_14px_rgba(15,23,42,0.015)] backdrop-blur-[14px]"
          >
            <span className="mr-[22px] text-[24px] leading-none"></span>
            Continue with Apple
          </button>
        </section>

        <div className="mt-[26px] flex items-center justify-center gap-[14px] text-[15px] tracking-[-0.025em]">
          <span className="text-[#a4a5ab]">{isLogin ? 'New to Kivo?' : 'Already have an account?'}</span>
          <button type="button" onClick={toggleMode} className="font-medium text-[#17181b]">
            {isLogin ? 'Create account' : 'Log in'}
          </button>
        </div>
      </div>
    </main>
  );
}
