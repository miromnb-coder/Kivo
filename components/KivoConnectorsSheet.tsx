'use client';

import { ChevronRight, Github, Plus, Settings2, SlidersHorizontal, X } from 'lucide-react';

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
  { name: 'Outlook Mail', icon: 'outlook', control: 'connect' },
  { name: 'Outlook Calendar', icon: 'calendar', control: 'connect' },
  { name: 'Instagram', icon: 'instagram', control: 'connect', badge: 'Beta' },
  { name: 'Meta Ads Manager', icon: 'meta', control: 'connect', badge: 'Beta' },
];

function GmailIcon() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
      <path d="M2 3.5v13A1.5 1.5 0 0 0 3.5 18H7V8.2L2 4.45v-.95Z" fill="#34A853" />
      <path d="M19 18h3.5A1.5 1.5 0 0 0 24 16.5v-13l-5 4.7V18Z" fill="#4285F4" />
      <path d="M7 8.2V18h12V8.2l-6 4.45L7 8.2Z" fill="#EA4335" />
      <path d="M2 3.5 13 11.7 24 3.5A1.5 1.5 0 0 0 22.5 2h-1.1L13 8.25 4.6 2H3.5A1.5 1.5 0 0 0 2 3.5Z" fill="#FBBC04" />
      <path d="M2 3.5 13 11.7l2.15-1.6L4.6 2H3.5A1.5 1.5 0 0 0 2 3.5Z" fill="#EA4335" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="3" width="20" height="19" rx="3" fill="#fff" />
      <path d="M5 3h14a3 3 0 0 1 3 3v3H2V6a3 3 0 0 1 3-3Z" fill="#4285F4" />
      <path d="M2 9h5v13H5a3 3 0 0 1-3-3V9Z" fill="#34A853" />
      <path d="M17 9h5v10a3 3 0 0 1-3 3h-2V9Z" fill="#FBBC04" />
      <path d="M7 9h10v13H7V9Z" fill="#fff" />
      <text x="12" y="17" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4285F4">31</text>
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="27" height="24" viewBox="0 0 27 24" fill="none" aria-hidden="true">
      <path d="M10.2 2h6.6L26 18h-6.7L10.2 2Z" fill="#FABB05" />
      <path d="M10.2 2 1 18l3.35 5.8L13.5 7.85 10.2 2Z" fill="#34A853" />
      <path d="M4.35 23.8h18.3L26 18H7.7l-3.35 5.8Z" fill="#4285F4" />
    </svg>
  );
}

function ConnectorIcon({ icon }: { icon: string }) {
  if (icon === 'gmail') return <GmailIcon />;
  if (icon === 'google-calendar') return <GoogleCalendarIcon />;
  if (icon === 'github') return <Github size={25} fill="currentColor" strokeWidth={0} />;
  if (icon === 'browser') return <div className="h-[25px] w-[25px] rounded-full border-[3px] border-[#333]" />;
  if (icon === 'drive') return <DriveIcon />;
  if (icon === 'outlook') return <div className="h-[22px] w-[26px] rounded-[5px] bg-gradient-to-br from-[#42a5f5] to-[#0067b8]" />;
  if (icon === 'calendar') return <div className="h-[24px] w-[24px] rounded-[5px] bg-gradient-to-br from-[#47c7f4] to-[#1684d8]" />;
  if (icon === 'instagram') return <div className="h-[25px] w-[25px] rounded-[7px] bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]" />;
  if (icon === 'meta') return <div className="text-[30px] font-semibold leading-none text-[#1684ff]">∞</div>;

  return null;
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
                    <ConnectorIcon icon={connector.icon} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-[10px] text-[21px] tracking-[-0.035em]">
                    <span className="truncate">{connector.name}</span>
                    {connector.badge ? (
                      <span className="rounded-[9px] border border-[#d5d5d8] px-[9px] py-[2px] text-[15px] tracking-[-0.02em] text-[#8a8a8f]">
                        {connector.badge}
                      </span>
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
