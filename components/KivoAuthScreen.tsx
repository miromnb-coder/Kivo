'use client';

import { ArrowRight, ChevronLeft, Eye, Lock, Mail, UserRound } from 'lucide-react';

function AuthInput({ icon, placeholder, rightIcon }: { icon: React.ReactNode; placeholder: string; rightIcon?: React.ReactNode }) {
  return (
    <div className="flex h-[58px] items-center rounded-[28px] border border-[#ececef] bg-white/42 px-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_28px_rgba(15,23,42,0.025)] backdrop-blur-[14px]">
      <div className="flex h-[24px] w-[24px] items-center justify-center text-[#1f2023]">{icon}</div>
      <input
        className="ml-[18px] h-full flex-1 bg-transparent text-[18px] tracking-[-0.025em] text-[#202024] outline-none placeholder:text-[#a4a5ab]"
        placeholder={placeholder}
        type={placeholder.toLowerCase().includes('password') ? 'password' : 'text'}
      />
      {rightIcon ? <div className="ml-[12px] text-[#a9aab0]">{rightIcon}</div> : null}
    </div>
  );
}

export function KivoAuthScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f4f6] text-[#202024]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,#ffffff_0%,#f7f7f8_54%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-[34px] pt-[calc(env(safe-area-inset-top)+50px)] pb-[calc(env(safe-area-inset-bottom)+28px)]">
        <button className="absolute left-[24px] top-[calc(env(safe-area-inset-top)+28px)] flex h-[42px] w-[42px] items-center justify-center text-[#202024]" aria-label="Back">
          <ChevronLeft size={25} strokeWidth={2.1} />
        </button>

        <section className="pt-[124px] text-center">
          <h1 className="text-[34px] font-normal leading-[1.1] tracking-[-0.055em] text-[#17181b]">Create your account</h1>
          <p className="mx-auto mt-[22px] max-w-[250px] text-[18px] leading-[1.45] tracking-[-0.03em] text-[#9d9ea5]">
            Join Kivo and get your<br />personal AI assistant.
          </p>
        </section>

        <section className="mt-[62px] space-y-[10px]">
          <AuthInput icon={<UserRound size={20} strokeWidth={1.9} />} placeholder="Full name" />
          <AuthInput icon={<Mail size={20} strokeWidth={1.9} />} placeholder="Email" />
          <AuthInput icon={<Lock size={19} strokeWidth={2} />} placeholder="Password" rightIcon={<Eye size={22} strokeWidth={1.9} />} />
          <AuthInput icon={<Lock size={19} strokeWidth={2} />} placeholder="Confirm password" rightIcon={<Eye size={22} strokeWidth={1.9} />} />
        </section>

        <button className="mt-[20px] flex h-[66px] items-center justify-center rounded-[28px] bg-[#111113] px-[22px] text-[19px] font-medium tracking-[-0.03em] text-white shadow-[0_16px_34px_rgba(0,0,0,0.12)]">
          <span className="flex-1 text-center">Create account</span>
          <ArrowRight size={24} strokeWidth={1.8} />
        </button>

        <div className="mt-[30px] flex items-center gap-[18px] px-[14px]">
          <div className="h-px flex-1 bg-[#e3e3e6]" />
          <span className="text-[15px] tracking-[-0.025em] text-[#a0a1a7]">Or continue with</span>
          <div className="h-px flex-1 bg-[#e3e3e6]" />
        </div>

        <section className="mt-[18px] space-y-[12px]">
          <button className="flex h-[58px] w-full items-center justify-center rounded-[27px] border border-[#ececef] bg-white/42 text-[18px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_8px_28px_rgba(15,23,42,0.02)] backdrop-blur-[14px]">
            <span className="mr-[22px] text-[22px] font-semibold text-[#4285f4]">G</span>
            Continue with Google
          </button>
          <button className="flex h-[58px] w-full items-center justify-center rounded-[27px] border border-[#ececef] bg-white/42 text-[18px] font-medium tracking-[-0.03em] text-[#202024] shadow-[0_8px_28px_rgba(15,23,42,0.02)] backdrop-blur-[14px]">
            <span className="mr-[22px] text-[24px] leading-none"></span>
            Continue with Apple
          </button>
        </section>

        <div className="mt-auto flex items-center justify-center gap-[20px] pb-[22px] pt-[34px] text-[17px] tracking-[-0.025em]">
          <span className="text-[#a2a3a9]">Already have an account?</span>
          <button className="text-[#17181b]">Log in</button>
        </div>
      </div>
    </main>
  );
}
