'use client';

import { ChevronRight, Github, Plus, SlidersHorizontal, X } from 'lucide-react';

type KivoConnectorsSheetProps = {
  open: boolean;
  onClose: () => void;
};

const connectors = [
  { name: 'Gmail', icon: 'gmail', control: 'connect' },
  { name: 'Google Calendar', icon: 'google-calendar', control: 'connect' },
  { name: 'GitHub', icon: 'github', control: 'connect' },
  { name: 'My browser', icon: 'browser', control: 'connect' },
  { name: 'Google Drive', icon: 'drive', control: 'connect' },
  { name: 'Outlook Mail', icon: 'outlook-mail', control: 'connect' },
  { name: 'Outlook Calendar', icon: 'outlook-calendar', control: 'connect' },
  { name: 'Instagram', icon: 'instagram', control: 'connect', badge: 'Beta' },
  { name: 'Meta Ads Manager', icon: 'meta', control: 'connect', badge: 'Beta' },
];

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'github') return <Github size={25} fill="currentColor" strokeWidth={0} />;
  if (icon === 'browser') return <div className="h-[25px] w-[25px] rounded-full border-[3px] border-[#333]" />;

  const brandMap: Record<string, string> = {
    gmail: 'https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png',
    'google-calendar': 'https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png',
    drive: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png',
    'outlook-mail': 'https://res.cdn.office.net/assets/mail/file-icon/png/outlook_32x32.png',
    'outlook-calendar': 'https://res.cdn.office.net/assets/calendar/file-icon/png/calendar_32x32.png',
    instagram: 'https://static.cdninstagram.com/rsrc.php/v4/yI/r/VsNE-OHk_8a.png',
    meta: 'https://static.xx.fbcdn.net/rsrc.php/y9/r/tL_v571NdZ0.svg',
  };

  const src = brandMap[icon];
  if (!src) return null;

  return <img src={src} alt="" className="h-[25px] w-[25px] object-contain" draggable={false} />;
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95]">
      <button type="button" aria-label="Close connectors" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-[3px]" />

      <div className="absolute inset-x-0 bottom-0 mx-auto h-[78vh] w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mt-[8px] h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />

        <div className="relative flex h-[56px] items-center justify-center px-[18px]">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute left-[18px] flex h-[42px] w-[42px] items-center justify-center text-[#1f2023]">
            <X size={27} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#111]">Connectors</h2>
        </div>

        <div className="h-[calc(100%-69px)] overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[22px] overscroll-contain">
          <div className="overflow-hidden rounded-[24px] bg-[#f4f4f5] px-[18px]">
            <button type="button" className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]">
              <Plus size={24} strokeWidth={2} />
              <span className="flex-1 text-[21px] tracking-[-0.035em]">Add connectors</span>
              <ChevronRight size={23} strokeWidth={2.2} className="text-[#8b8b90]" />
            </button>
            <div className="ml-[42px] h-px bg-[#dddddf]" />
            <button type="button" className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]">
              <SlidersHorizontal size={24} strokeWidth={2} />
              <span className="flex-1 text-[21px] tracking-[-0.035em]">Manage connectors</span>
              <ChevronRight size={23} strokeWidth={2.2} className="text-[#8b8b90]" />
            </button>
          </div>

          <div className="mt-[28px] overflow-hidden rounded-[24px] bg-[#f4f4f5] px-[18px]">
            {connectors.map((connector, index) => (
              <div key={connector.name}>
                <button type="button" className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]">
                  <span className="flex h-[28px] w-[28px] items-center justify-center">
                    <BrandIcon icon={connector.icon} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-[10px] text-[21px] tracking-[-0.035em]">
                    <span className="truncate">{connector.name}</span>
                    {connector.badge ? (
                      <span className="rounded-[9px] border border-[#d5d5d8] px-[9px] py-[2px] text-[15px] tracking-[-0.02em] text-[#8a8a8f]">{connector.badge}</span>
                    ) : null}
                  </span>
                  <span className="text-[20px] tracking-[-0.03em] text-[#7e7e84]">Connect</span>
                </button>
                {index < connectors.length - 1 ? <div className="ml-[46px] h-px bg-[#dddddf]" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
