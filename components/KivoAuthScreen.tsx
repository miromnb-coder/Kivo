'use client';

import { ArrowRight, ChevronLeft, Eye, Lock, Mail, UserRound } from 'lucide-react';

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

function AuthInput({ icon, placeholder, rightIcon }: { icon: React.ReactNode; placeholder: string; rightIcon?: React.ReactNode }) {
  return (
    <div className="flex h-[52px] items-center rounded-[26px] border border-[#ececef] bg-white/40 px-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.02)] backdrop-blur-[14px]">
      <div className="flex h-[24px] w-[24px] items-center justify-center text-[#1f2023]">{icon}</div>
      <input
        className="ml-[17px] h-full flex-1 bg-transparent text-[17px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#a4a5ab]"
        placeholder={placeholder}
        type={placeholder.toLowerCase().includes('password') ? 'password' : 'text'}
      />
      {rightIcon ? <div className="ml-[12px] text-[#a9aab0]">{rightIcon}</div> : null}
    </div>
  );
}

export function KivoAuthScreen() {
  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#f4f4f6] text-[#202024]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_31%,#ffffff_0%,#f7f7f8_54%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col px-[41px] pt-[calc(env(safe-area-inset-top)+31px)] pb-[calc(env(safe-area-inset-bottom)+30px)]">
        <button className="absolute left-[24px] top-[calc(env(safe-area-inset-top)+22px)] flex h-[42px] w-[42px] items-center justify-center text-[#202024]" aria-label="Back">
          <ChevronLeft size={25} strokeWidth={2.1} />
        </button>

        <section className="pt-[112px] text-center">
          <h1 className="text-[33px] font-normal leading-[1.08] tracking-[-0.055em] text-[#17181b]">Create your account</h1>
          <p className="mx-auto mt-[19px] max-w-[250px] text-[17px] leading-[1.45] tracking-[-0.03em] text-[#9d9ea5]">
            Join Kivo and get your<br />personal AI assistant.
          </p>
        </section>

        <section className="mt-[50px] space-y-[10px]">
          <AuthInput icon={<UserRound size={19} strokeWidth={1.9} />} placeholder="Full name" />
          <AuthInput icon={<Mail size={19} strokeWidth={1.9} />} placeholder="Email" />
          <AuthInput icon={<Lock size={18} strokeWidth={2} />} placeholder="Password" rightIcon={<Eye size={21} strokeWidth={1.9} />} />
          <AuthInput icon={<Lock size={18} strokeWidth={2} />} placeholder="Confirm password" rightIcon={<Eye size={21} strokeWidth={1.9} />} />
        </section>

        <button className="mt-[20px] flex h-[60px] items-center justify-center rounded-[27px] bg-[#111113] px-[22px] text-[18px] font-medium tracking-[-0.03em] text-white shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
          <span className="flex-1 text-center">Create account</span>
          <ArrowRight size={24} strokeWidth={1.8} />
        </button>

        <div className="mt-[25px] flex items-center gap-[18px] px-[14px]">
          <div className="h-px flex-1 bg-[#e3e3e6]" />
          <span className="text-[15px] tracking-[-0.025em] text-[#a0a1a7]">Or continue with</span>
          <div className="h-px flex-1 bg-[#e3e3e6]" />
        </div>

        <section className="mt-[16px] space-y-[12px]">
          <button className="flex h-[54px] w-full items-center justify-center rounded-[27px] border border-[#ececef] bg-white/40 text-[17px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_8px_24px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
            <span className="mr-[22px] flex h-[20px] w-[20px] items-center justify-center"><GoogleIcon /></span>
            Continue with Google
          </button>
          <button className="flex h-[54px] w-full items-center justify-center rounded-[27px] border border-[#ececef] bg-white/40 text-[17px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_8px_24px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
            <span className="mr-[22px] text-[24px] leading-none"></span>
            Continue with Apple
          </button>
        </section>

        <div className="mt-[34px] flex items-center justify-center gap-[18px] text-[16px] tracking-[-0.025em]">
          <span className="text-[#a2a3a9]">Already have an account?</span>
          <button className="text-[#17181b]">Log in</button>
        </div>
      </div>
    </main>
  );
}
