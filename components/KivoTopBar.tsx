import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';

export function KivoTopBar() {
  return (
    <header className="relative flex items-center justify-between px-8 pt-12 pb-6">
      <button aria-label="Go back" className="flex h-9 w-9 items-center justify-center text-[#26262a]">
        <ChevronLeft size={30} strokeWidth={1.6} />
      </button>

      <button className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-[24px] font-semibold tracking-[-0.02em] text-[#222225]">
        <span>Kivo</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ececef]">
          <ChevronDown size={16} strokeWidth={2.4} />
        </span>
      </button>

      <button className="ml-auto flex h-16 items-center gap-2.5 rounded-full border-[1.5px] border-[#d8d8dc] bg-[#f7f7f8] px-6 text-[19px] font-medium tracking-[-0.01em] text-[#303034]">
        <Sparkles size={20} strokeWidth={2} />
        <span>397</span>
      </button>
    </header>
  );
}
