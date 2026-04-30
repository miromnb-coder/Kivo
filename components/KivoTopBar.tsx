import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';

export function KivoTopBar() {
  return (
    <header className="flex items-center justify-between px-6 pt-10 pb-5 sm:px-8">
      <button aria-label="Go back" className="text-[#26262a]">
        <ChevronLeft size={33} strokeWidth={1.4} />
      </button>

      <button className="flex items-center gap-2.5 text-[49px] font-medium tracking-[-0.03em] text-[#1f1f22] leading-none scale-[0.34] origin-center">
        <span>Kivo</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ececef]">
          <ChevronDown size={20} strokeWidth={2.2} />
        </span>
      </button>

      <button className="flex h-14 items-center gap-2 rounded-full border border-[#dddddf] bg-[#f6f6f7] px-5 text-[37px] text-[#2d2d30] tracking-[-0.02em] scale-[0.4] origin-right">
        <Sparkles size={24} strokeWidth={2} />
        <span>397</span>
      </button>
    </header>
  );
}
