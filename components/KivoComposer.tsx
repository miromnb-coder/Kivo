import { ArrowUp, MessageCircleMore, Mic, Plus, SlidersVertical } from 'lucide-react';

function CircleButton({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      className={`flex h-11 w-11 items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#e9e9eb] text-[#b9b9bc]' : 'border-[#e2e2e5] bg-[#f6f6f7] text-[#1f1f22]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer() {
  return (
    <div className="fixed inset-x-0 bottom-0 px-3 pb-3">
      <div className="mx-auto w-full max-w-md rounded-[2.15rem] border border-[#ececef] bg-[#f5f5f6]/95 px-4 pt-5 pb-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <p className="px-2 text-[22px] font-normal tracking-[-0.01em] text-[#a2a2a6]">Ask anything or assign a task</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CircleButton>
              <Plus size={31} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <SlidersVertical size={25} strokeWidth={1.9} />
            </CircleButton>
          </div>

          <div className="flex items-center gap-3">
            <CircleButton>
              <MessageCircleMore size={22} strokeWidth={1.9} />
            </CircleButton>
            <CircleButton>
              <Mic size={23} strokeWidth={2} />
            </CircleButton>
            <CircleButton muted>
              <ArrowUp size={28} strokeWidth={2.2} />
            </CircleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
