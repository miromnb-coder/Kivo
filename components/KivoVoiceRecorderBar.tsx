'use client';

import { Check, X } from 'lucide-react';

type KivoVoiceRecorderBarProps = {
  open: boolean;
  seconds: number;
  onCancel: () => void;
  onConfirm: () => void;
};

const waveform = [
  8, 10, 9, 11, 8, 10, 9, 12, 10, 8, 14, 22, 28, 18, 12, 24, 16, 11, 9, 12, 10, 8, 9, 11, 8, 10, 9, 8,
];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function KivoVoiceRecorderBar({ open, seconds, onCancel, onConfirm }: KivoVoiceRecorderBarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-[16px] pb-[calc(env(safe-area-inset-bottom)+18px)] pointer-events-none">
      <div className="mx-auto flex h-[92px] w-full max-w-[430px] items-center rounded-[32px] border border-[#eeeeF1] bg-white/95 px-[14px] shadow-[0_12px_36px_rgba(0,0,0,0.06)] backdrop-blur-[18px] pointer-events-auto">
        <button type="button" aria-label="Cancel recording" onClick={onCancel} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-[#ececef] bg-[#f8f8f9] text-[#1f2023]">
          <X size={23} strokeWidth={1.9} />
        </button>

        <div className="mx-[22px] flex min-w-0 flex-1 items-center justify-center gap-[5px] overflow-hidden">
          {waveform.map((height, index) => (
            <span
              key={index}
              className={`block w-[4px] shrink-0 rounded-full ${index >= 10 && index <= 16 ? 'bg-[#1f2023]' : 'bg-[#c9c9ce]'}`}
              style={{ height }}
            />
          ))}
        </div>

        <div className="mr-[12px] text-[22px] font-normal leading-none tracking-[-0.04em] text-[#5f6066]">{formatTime(seconds)}</div>

        <button type="button" aria-label="Confirm recording" onClick={onConfirm} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#1f2023] text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
          <Check size={25} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}
