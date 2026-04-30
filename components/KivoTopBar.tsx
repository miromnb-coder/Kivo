import { ChevronDown, ChevronLeft, Sparkles } from 'lucide-react';

export function KivoTopBar() {
  return (
    <header className="relative z-20 flex h-[104px] items-start justify-between px-[28px] pt-[54px]">
      <button aria-label="Go back" className="flex h-9 w-9 items-center justify-center text-[#202124]">
        <ChevronLeft size={30} strokeWidth={1.75} />
      </button>

      <button className="absolute left-1/2 top-[58px] flex -translate-x-1/2 items-center gap-[9px] text-[23px] font-semibold leading-none tracking-[-0.035em] text-[#1f2023]">
        <span>Kivo</span>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#ececef] text-[#232428]">
          <ChevronDown size={16} strokeWidth={2.35} />
        </span>
      </button>

      <button className="flex h-[58px] items-center gap-[10px] rounded-full border border-[#dedee2] bg-[#f8f8f9]/85 px-[18px] text-[22px] font-medium leading-none tracking-[-0.035em] text-[#292a2e] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <Sparkles size={23} strokeWidth={1.9} />
        <span>397</span>
      </button>
    </header>
  );
}
