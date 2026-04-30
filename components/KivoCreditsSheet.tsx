'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronRight, HelpCircle, Inbox, Sparkles, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function KivoCreditsSheet({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999]">
      <button type="button" aria-label="Close credits" onClick={onClose} className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />

      <div className="absolute inset-x-0 bottom-0 mx-auto h-[86vh] w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.10)]">
        <div className="mx-auto mt-[10px] h-[5px] w-[40px] rounded-full bg-[#d0d0d3]" />

        <div className="relative flex h-[58px] items-center justify-center px-[18px]">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute left-[18px] flex h-[42px] w-[42px] items-center justify-center text-[#1f2023]">
            <X size={28} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#111]">Kivo Credits</h2>
        </div>

        <div className="h-[calc(100%-73px)] overflow-y-auto px-[18px] pb-[18px] pt-[18px] overscroll-contain">
          <div className="flex min-h-[88px] items-center justify-between rounded-[18px] border border-[#e6e6e8] bg-white px-[18px]">
            <div>
              <div className="text-[24px] font-semibold leading-none tracking-[-0.04em] text-[#202024]">Kivo Free</div>
              <div className="mt-[10px] text-[16px] leading-none tracking-[-0.02em] text-[#77787e]">Free plan</div>
            </div>
            <button type="button" className="h-[54px] rounded-full border border-[#e4e4e7] bg-white px-[28px] text-[20px] tracking-[-0.035em] text-[#202024]">Manage</button>
          </div>

          <div className="mt-[18px] overflow-hidden rounded-[18px] border border-[#e6e6e8] bg-white px-[18px]">
            <div className="flex h-[64px] items-center border-b border-[#ededee]">
              <Sparkles size={24} strokeWidth={2} />
              <span className="ml-[12px] text-[20px] tracking-[-0.035em] text-[#202024]">Credits</span>
              <HelpCircle size={18} strokeWidth={2} className="ml-[10px] text-[#96979c]" />
              <span className="ml-auto text-[23px] tracking-[-0.04em] text-[#202024]">397</span>
            </div>

            <div className="flex h-[48px] items-center border-b border-[#ededee]">
              <span className="text-[18px] tracking-[-0.035em] text-[#202024]">Free credits</span>
              <HelpCircle size={17} strokeWidth={2} className="ml-[10px] text-[#96979c]" />
              <span className="ml-auto text-[19px] tracking-[-0.035em] text-[#77787e]">397</span>
            </div>

            <div className="border-b border-[#ededee] py-[12px]">
              <div className="flex items-center">
                <span className="text-[18px] tracking-[-0.035em] text-[#202024]">Monthly credits</span>
                <HelpCircle size={17} strokeWidth={2} className="ml-[10px] text-[#96979c]" />
                <span className="ml-auto text-[19px] tracking-[-0.035em] text-[#77787e]">397 / 8000</span>
              </div>
              <div className="mt-[12px] h-[8px] overflow-hidden rounded-full bg-[#dedee1]">
                <div className="h-full w-[9%] rounded-full bg-[#202024]" />
              </div>
            </div>

            <div className="flex h-[62px] items-center">
              <CalendarDays size={22} strokeWidth={1.9} />
              <span className="ml-[12px] text-[19px] tracking-[-0.035em] text-[#202024]">Daily refresh credits</span>
              <HelpCircle size={17} strokeWidth={2} className="ml-[10px] text-[#96979c]" />
              <span className="ml-auto text-[23px] tracking-[-0.04em] text-[#202024]">300</span>
            </div>
          </div>

          <div className="mt-[18px] flex h-[66px] items-center rounded-[16px] bg-[#f1f1f3] px-[18px]">
            <div className="mr-[14px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#dedee2] text-[#a3a4aa]">
              <Sparkles size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[18px] font-medium leading-none tracking-[-0.035em] text-[#202024]">You have ~ 5–12 tasks left</div>
              <div className="mt-[8px] text-[15px] leading-none tracking-[-0.02em] text-[#77787e]">Resets in 14h 32m</div>
            </div>
          </div>

          <div className="mt-[22px] flex items-center px-[14px]">
            <h3 className="flex-1 text-[18px] font-semibold tracking-[-0.035em] text-[#202024]">Credits history</h3>
            <span className="mr-[8px] text-[16px] tracking-[-0.025em] text-[#77787e]">UTC+3</span>
            <HelpCircle size={18} strokeWidth={2} className="text-[#96979c]" />
          </div>

          <div className="mt-[12px] flex h-[315px] flex-col rounded-[18px] border border-[#e6e6e8] bg-white p-[14px]">
            <div className="flex flex-1 flex-col items-center justify-center text-[#9a9ba1]">
              <Inbox size={31} strokeWidth={1.7} />
              <div className="mt-[14px] text-[17px] tracking-[-0.025em]">No history yet</div>
            </div>
            <button type="button" className="flex h-[50px] items-center justify-center gap-[10px] rounded-[14px] border border-[#e6e6e8] bg-white text-[17px] tracking-[-0.03em] text-[#202024]">
              <span>View all history</span>
              <ChevronRight size={19} strokeWidth={2} className="text-[#8d8e94]" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
