'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Mail,
  RefreshCw,
  Sparkles,
  Tag,
  Target,
  Zap,
} from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type KivoTodayDashboardProps = {
  className?: string;
  onPromptSelect?: (prompt: string) => void;
};

type CardHeaderProps = {
  icon: ReactNode;
  title: string;
};

type LivingHeadlineProps = {
  phrases: string[];
  firstName: string;
};

const priorities = [
  ['Finalize Q2 investor deck', 'High impact'],
  ['Review product feedback', 'Customer insights'],
  ['Prepare marketing sync', 'Team alignment'],
];

function EmptyCheck() {
  return <span className="block h-[17px] w-[17px] shrink-0 rounded-full border border-[#bfc0c5] bg-transparent" />;
}

function SoftCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[25px] border border-black/[0.045] bg-white/50 shadow-[0_14px_36px_rgba(15,23,42,0.033)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function InnerPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[15px] border border-black/[0.035] bg-[#f7f7f8]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${className}`}>{children}</div>;
}

function CardHeader({ icon, title }: CardHeaderProps) {
  return (
    <div className="flex h-[23px] items-center gap-[8px] text-[#202024]">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#202024]" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-none tracking-[-0.032em]">{title}</span>
      <ChevronRight size={14} strokeWidth={1.85} className="shrink-0 text-[#585960]" aria-hidden="true" />
    </div>
  );
}

function getFirstName(value?: string | null) {
  const clean = value?.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.split(' ')[0]?.slice(0, 24) ?? '';
}

function LivingHeadline({ phrases, firstName }: LivingHeadlineProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrase = phrases[phraseIndex % phrases.length] ?? phrases[0] ?? 'Here’s your day';
  const letters = Array.from(phrase);
  const nameStartIndex = firstName && phrase.endsWith(`, ${firstName}`) ? phrase.length - firstName.length : -1;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPhraseIndex((current) => current + 1);
    }, 6200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <h1
      key={phrase}
      className="kivo-living-headline mx-auto h-[34px] whitespace-nowrap text-[30px] font-semibold leading-[1.08] tracking-[-0.064em] text-[#202024]"
      aria-label={phrase}
    >
      {letters.map((letter, index) => {
        const isSpace = letter === ' ';
        const isName = nameStartIndex >= 0 && index >= nameStartIndex;
        const shouldHop = !isSpace && (isName || (index + phraseIndex) % 5 === 0);
        const delay = 28 + index * 22;
        const hopDelay = delay + 190;

        return (
          <span
            key={`${phrase}-${letter}-${index}`}
            aria-hidden="true"
            className={`kivo-living-letter ${isName ? 'kivo-living-name' : ''}`}
            style={{
              animationDelay: shouldHop ? `${delay}ms, ${hopDelay}ms` : `${delay}ms`,
              animationName: shouldHop ? 'kivoLetterReveal, kivoLetterHop' : 'kivoLetterReveal',
              animationDuration: shouldHop ? '620ms, 520ms' : '620ms',
              animationTimingFunction: shouldHop
                ? 'cubic-bezier(0.16,1,0.3,1), cubic-bezier(0.34,1.56,0.64,1)'
                : 'cubic-bezier(0.16,1,0.3,1)',
              animationFillMode: 'both',
            }}
          >
            {isSpace ? '\u00A0' : letter}
          </span>
        );
      })}
    </h1>
  );
}

export function KivoTodayDashboard({ className = '', onPromptSelect }: KivoTodayDashboardProps) {
  const [firstName, setFirstName] = useState('');
  const selectPrompt = (prompt: string) => onPromptSelect?.(prompt);

  const headlinePhrases = useMemo(
    () => [
      firstName ? `Here’s your day, ${firstName}` : 'Here’s your day',
      'Your next step is clear',
      'Kivo is ready',
      '3 things need your focus',
    ],
    [firstName],
  );

  useEffect(() => {
    let mounted = true;

    async function loadUserName() {
      try {
        const supabase = createSupabaseBrowser();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return;

        const metadata = user.user_metadata ?? {};
        const metadataName =
          typeof metadata.full_name === 'string'
            ? metadata.full_name
            : typeof metadata.name === 'string'
              ? metadata.name
              : typeof metadata.display_name === 'string'
                ? metadata.display_name
                : '';

        const { data: profile } = await supabase
          .from('kivo_profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const resolvedName = getFirstName(profile?.display_name) || getFirstName(metadataName) || getFirstName(user.email?.split('@')[0]);
        if (mounted && resolvedName) setFirstName(resolvedName);
      } catch {
        // The headline still works without a profile name.
      }
    }

    loadUserName();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className={`absolute inset-x-0 top-[88px] bottom-[170px] z-20 overflow-y-auto px-[22px] pt-[4px] pb-[12px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`} aria-label="Today OS dashboard">
      <style>{`
        @keyframes kivoLetterReveal {
          0% { opacity: 0; filter: blur(7px); transform: translate3d(0, 9px, 0) scale(0.985); }
          64% { opacity: 1; filter: blur(0px); transform: translate3d(0, -1px, 0) scale(1.004); }
          100% { opacity: 1; filter: blur(0px); transform: translate3d(0, 0, 0) scale(1); }
        }

        @keyframes kivoLetterHop {
          0%, 100% { transform: translate3d(0, 0, 0); }
          45% { transform: translate3d(0, -3px, 0); }
        }

        .kivo-living-headline {
          text-rendering: geometricPrecision;
        }

        .kivo-living-letter {
          display: inline-block;
          opacity: 0;
          will-change: transform, opacity, filter;
        }

        .kivo-living-name {
          color: #18181b;
          text-shadow: 0 10px 28px rgba(124, 140, 255, 0.12);
        }
      `}</style>

      <div className="mx-auto w-full max-w-[384px]">
        <div className="text-center">
          <LivingHeadline phrases={headlinePhrases} firstName={firstName} />
          <p className="mt-[10px] text-[15.5px] font-normal leading-none tracking-[-0.035em] text-[#a4a5ab]">Your day at a glance</p>
        </div>

        <SoftCard className="mt-[21px] px-[17px] pb-[12px] pt-[14px]">
          <CardHeader icon={<Target size={15} strokeWidth={1.8} />} title="Top priorities" />
          <div className="mt-[12px]">
            {priorities.map(([title, subtitle], index) => (
              <div key={title}>
                <div className="flex min-h-[38px] items-center gap-[13px] py-[4px]">
                  <EmptyCheck />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-normal leading-[1.13] tracking-[-0.034em] text-[#202024]">{title}</p>
                    <p className="mt-[3px] truncate text-[11.5px] font-normal leading-none tracking-[-0.018em] text-[#94959c]">{subtitle}</p>
                  </div>
                </div>
                {index < priorities.length - 1 ? <div className="ml-[30px] h-px bg-black/[0.045]" /> : null}
              </div>
            ))}
          </div>
        </SoftCard>

        <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
          <SoftCard className="h-[105px] px-[12px] py-[13px]">
            <CardHeader icon={<Zap size={15} strokeWidth={1.75} />} title="Next task" />
            <InnerPanel className="mt-[11px] flex h-[50px] flex-col justify-center px-[11px]">
              <div className="flex items-center gap-[9px]">
                <EmptyCheck />
                <p className="min-w-0 truncate text-[12.5px] font-normal leading-none tracking-[-0.032em] text-[#202024]">Research analysis</p>
              </div>
              <div className="ml-[26px] mt-[8px] flex items-center gap-[5px] text-[#a3a4ab]">
                <Clock3 size={11} strokeWidth={1.7} />
                <span className="text-[11.5px] leading-none tracking-[-0.02em]">45 min</span>
              </div>
            </InnerPanel>
          </SoftCard>

          <SoftCard className="h-[105px] px-[12px] py-[13px]">
            <CardHeader icon={<CalendarDays size={15} strokeWidth={1.75} />} title="Calendar" />
            <div className="mt-[14px] grid grid-cols-[17px_1fr] gap-x-[7px] pl-[1px]">
              <div className="relative row-span-2 flex flex-col items-center">
                <span className="absolute bottom-[6px] top-[6px] w-px bg-[#dadbe0]" />
                <span className="relative z-10 mt-[2px] h-[5.5px] w-[5.5px] rounded-full bg-[#c9cad0]" />
                <span className="relative z-10 mt-[21px] h-[5.5px] w-[5.5px] rounded-full bg-[#c9cad0]" />
              </div>
              <p className="h-[27px] truncate text-[12px] leading-none tracking-[-0.022em] text-[#202024]"><span className="mr-[8px] text-[#92939a]">10:00</span>Stand-up</p>
              <p className="h-[27px] truncate text-[12px] leading-none tracking-[-0.022em] text-[#202024]"><span className="mr-[8px] text-[#92939a]">13:00</span>Review</p>
            </div>
          </SoftCard>
        </div>

        <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
          <SoftCard className="h-[105px] px-[12px] py-[13px]">
            <CardHeader icon={<Sparkles size={15} strokeWidth={1.65} className="text-[#7C8CFF]" />} title="AI suggestion" />
            <button type="button" onClick={() => selectPrompt('Start a 25 minute focus session for my Kivo redesign and tell me the first step.')} className="mt-[11px] block w-full text-left active:scale-[0.99]">
              <InnerPanel className="h-[50px] px-[11px] py-[8px]">
                <div className="flex gap-[7px]">
                  <Sparkles size={12} strokeWidth={1.65} className="mt-[1px] shrink-0 text-[#7C8CFF]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-normal leading-[1.11] tracking-[-0.034em] text-[#202024]">Start redesign</p>
                    <p className="mt-[7px] truncate text-[11.5px] leading-none tracking-[-0.018em] text-[#96979f]">25 min focus window</p>
                  </div>
                </div>
              </InnerPanel>
            </button>
          </SoftCard>

          <SoftCard className="h-[105px] px-[12px] py-[13px]">
            <CardHeader icon={<RefreshCw size={14} strokeWidth={1.7} />} title="Open loops" />
            <div className="mt-[11px] space-y-[5px]">
              <div className="flex h-[26px] items-center gap-[7px] rounded-[11px] border border-black/[0.035] bg-[#f7f7f8]/70 px-[8px]">
                <Mail size={12} strokeWidth={1.7} className="shrink-0 text-[#202024]" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] tracking-[-0.025em] text-[#202024]">2 replies</span>
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#eeeeef] px-[5px] text-[10.5px] tracking-[-0.02em] text-[#202024]">2</span>
              </div>
              <div className="flex h-[26px] items-center gap-[7px] rounded-[11px] border border-black/[0.035] bg-[#f7f7f8]/70 px-[8px]">
                <CircleDollarSign size={12} strokeWidth={1.7} className="shrink-0 text-[#202024]" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] tracking-[-0.025em] text-[#202024]">1 bill due</span>
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#eeeeef] px-[5px] text-[10.5px] tracking-[-0.02em] text-[#202024]">1</span>
              </div>
            </div>
          </SoftCard>
        </div>

        <div className="mt-[10px] grid grid-cols-3 gap-[8px]">
          <button type="button" onClick={() => selectPrompt('Plan my day and suggest the most important next steps.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[7px] text-[13px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><CalendarDays size={14} strokeWidth={1.75} /><span className="truncate">Plan my day</span></button>
          <button type="button" onClick={() => selectPrompt('Check my inbox and show what needs attention.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[7px] text-[13px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><Mail size={14} strokeWidth={1.8} /><span className="truncate">Check inbox</span></button>
          <button type="button" onClick={() => selectPrompt('Find subscriptions, bills, or money leaks I should review.')} className="flex h-[34px] items-center justify-center gap-[5px] rounded-full border border-black/[0.05] bg-white/68 px-[7px] text-[13px] font-normal tracking-[-0.035em] text-[#202024] shadow-[0_9px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl transition active:scale-[0.98]"><Tag size={14} strokeWidth={1.75} /><span className="truncate">Find savings</span></button>
        </div>
      </div>
    </section>
  );
}
