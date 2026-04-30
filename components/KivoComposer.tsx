import { ArrowUp, MessageCircleMore, Mic, Plus, SlidersVertical } from 'lucide-react';

function CircleButton({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#e9e9eb] text-[#c7c7cc]' : 'border-[#dedee2] bg-[#f7f7f8] text-[#202024]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer() {
  return (
    <div className="fixed inset-x-0 bottom-0 px-[16px] pb-[18px]">
      <div className="mx-auto w-full max-w-[430px] rounded-[36px] border border-[#ececef] bg-[#f8f8f9] px-[18px] pt-[16px] pb-[14px] shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
        <p className="px-[4px] text-[17px] tracking-[-0.02em] text-[#a7a7ad]">
          Ask anything or assign a task
        </p>

        <div className="mt-[14px] flex items-center justify-between">
          <div className="flex items-center gap-[14px]">
            <CircleButton>
              <Plus size={28} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <SlidersVertical size={24} strokeWidth={1.8} />
            </CircleButton>
          </div>

          <div className="flex items-center gap-[10px]">
            <CircleButton>
              <MessageCircleMore size={22} strokeWidth={1.8} />
            </CircleButton>
            <CircleButton>
              <Mic size={22} strokeWidth={2} />
            </CircleButton>
            <CircleButton muted>
              <ArrowUp size={24} strokeWidth={2.1} />
            </CircleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
