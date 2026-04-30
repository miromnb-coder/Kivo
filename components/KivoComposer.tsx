import { ArrowUp, MessageCircleMore, Mic, Plus } from 'lucide-react';

function KivoToolsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      <circle cx="7" cy="9" r="1.8" fill="currentColor" />
      <circle cx="12" cy="15" r="1.8" fill="currentColor" />
      <circle cx="17" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

function CircleButton({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#eeeeef] text-[#cfcfd4]' : 'border-[#e9e9ec] bg-[#f9f9fa] text-[#202024]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer() {
  return (
    <div className="fixed inset-x-0 bottom-0 px-[16px] pb-[18px]">
      <div className="mx-auto w-full max-w-[430px] rounded-[34px] border border-[#eeeeF1] bg-[#f9f9fa] px-[16px] pt-[14px] pb-[12px] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <p className="px-[4px] text-[17px] tracking-[-0.02em] text-[#a7a7ad]">
          Ask anything or assign a task
        </p>

        <div className="mt-[14px] flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <CircleButton>
              <Plus size={22} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <KivoToolsIcon />
            </CircleButton>
          </div>

          <div className="flex items-center gap-[8px]">
            <CircleButton>
              <MessageCircleMore size={20} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <Mic size={20} strokeWidth={1.7} />
            </CircleButton>
            <CircleButton muted>
              <ArrowUp size={22} strokeWidth={1.8} />
            </CircleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
