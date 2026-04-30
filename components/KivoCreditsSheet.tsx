'use client';

import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function KivoCreditsSheet({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close credits"
        onClick={onClose}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto h-[86vh] w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.10)]">
        <div className="mx-auto mt-[10px] h-[5px] w-[40px] rounded-full bg-[#d0d0d3]" />

        <div className="relative flex h-[58px] items-center justify-center px-[18px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute left-[18px] flex h-[42px] w-[42px] items-center justify-center text-[#1f2023]"
          >
            <X size={28} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#111]">Kivo Credits</h2>
        </div>

        <div className="h-[calc(100%-73px)] overflow-y-auto px-[18px] pb-[18px] pt-[18px] overscroll-contain" />
      </div>
    </div>
  );
}
