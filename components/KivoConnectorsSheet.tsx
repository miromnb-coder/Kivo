'use client';

import { ChevronRight, Github, Plus, Settings2, SlidersHorizontal, X } from 'lucide-react';

type KivoConnectorsSheetProps = {
  open: boolean;
  onClose: () => void;
};

const connectors = [
  { name: 'Gmail', icon: 'M', color: 'text-[#ea4335]', control: 'toggle' },
  { name: 'Google Calendar', icon: '31', color: 'text-[#4285f4]', control: 'toggle' },
  { name: 'GitHub', icon: 'github', control: 'toggle' },
  { name: 'My browser', icon: 'browser', control: 'connect' },
  { name: 'Google Drive', icon: 'drive', control: 'connect' },
  { name: 'Outlook Mail', icon: 'outlook', control: 'connect' },
  { name: 'Outlook Calendar', icon: 'calendar', control: 'connect' },
  { name: 'Instagram', icon: 'instagram', control: 'connect', badge: 'Beta' },
  { name: 'Meta Ads Manager', icon: 'meta', control: 'connect', badge: 'Beta' },
];

function ConnectorIcon({ icon, color }: { icon: string; color?: string }) {
  if (icon === 'github') return <Github size={23} fill="currentColor" strokeWidth={0} />;
  if (icon === 'browser') return <div className="h-[24px] w-[24px] rounded-full border-[3px] border-[#333]" />;
  if (icon === 'drive') return <div className="h-0 w-0 border-l-[13px] border-r-[13px] border-b-[23px] border-l-transparent border-r-transparent border-b-[#34a853]" />;
  if (icon === 'outlook') return <div className="h-[21px] w-[25px] rounded-[5px] bg-[#1473c8]" />;
  if (icon === 'calendar') return <div className="h-[24px] w-[24px] rounded-[5px] bg-[#2da7df]" />;
  if (icon === 'instagram') return <div className="h-[24px] w-[24px] rounded-[7px] bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]" />;
  if (icon === 'meta') return <div className="text-[28px] font-semibold leading-none text-[#1684ff]">∞</div>;

  return <span className={`text-[19px] font-bold leading-none ${color ?? 'text-[#333]'}`}>{icon}</span>;
}

function ToggleMock() {
  return (
    <span className="relative h-[32px] w-[56px] rounded-full bg-[#dedee1]">
      <span className="absolute left-[2px] top-[2px] h-[28px] w-[28px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.16)]" />
    </span>
  );
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95]">
      <button
        type="button"
        aria-label="Close connectors"
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-[3px]"
      />

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
                    <ConnectorIcon icon={connector.icon} color={connector.color} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-[10px] text-[21px] tracking-[-0.035em]">
                    <span className="truncate">{connector.name}</span>
                    {connector.badge ? (
                      <span className="rounded-[9px] border border-[#d5d5d8] px-[9px] py-[2px] text-[15px] tracking-[-0.02em] text-[#8a8a8f]">
                        {connector.badge}
                      </span>
                    ) : null}
                  </span>
                  {connector.control === 'toggle' ? <ToggleMock /> : <span className="text-[20px] tracking-[-0.03em] text-[#7e7e84]">Connect</span>}
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
