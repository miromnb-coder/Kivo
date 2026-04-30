import { ArrowUp, MessageCircleMore, Mic, Plus, SlidersVertical } from 'lucide-react';

function CircleButton({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <button
      className={`flex h-[56px] w-[56px] items-center justify-center rounded-full border ${
        muted ? 'border-transparent bg-[#e8e8ea] text-[#c0c0c4]' : 'border-[#dddddf] bg-[#f7f7f8] text-[#202024]'
      }`}
    >
      {children}
    </button>
  );
}

export function KivoComposer() {
  return (
    <div className="fixed inset-x-0 bottom-0 px-4 pb-5">
      <div className="mx-auto w-full max-w-[430px] rounded-[42px] border border-[#ececef] bg-[#f8f8f9] px-6 pt-7 pb-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <p className="px-1 text-[18px] font-normal tracking-[-0.01em] text-[#a3a3a8]">Ask anything or assign a task</p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <CircleButton>
              <Plus size={34} strokeWidth={1.6} />
            </CircleButton>
            <CircleButton>
              <SlidersVertical size={28} strokeWidth={1.9} />
            </CircleButton>
          </div>

          <div className="flex items-center gap-3.5">
            <CircleButton>
              <MessageCircleMore size={24} strokeWidth={1.9} />
            </CircleButton>
            <CircleButton>
              <Mic size={24} strokeWidth={2} />
            </CircleButton>
            <CircleButton muted>
              <ArrowUp size={29} strokeWidth={2.2} />
            </CircleButton>
          </div>
        </div>
      </div>
    </div>
  );
}
