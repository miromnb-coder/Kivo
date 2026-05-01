'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { KivoCalendarConnectorDetail } from './KivoCalendarConnectorDetail';
import { KivoGmailConnectorDetail } from './KivoGmailConnectorDetail';

type KivoConnectorsSheetProps = {
  open: boolean;
  onClose: () => void;
};

const connectors = [
  { name: 'Gmail', icon: 'gmail' },
  { name: 'Google Calendar', icon: 'google-calendar' },
  { name: 'GitHub', icon: 'github' },
  { name: 'My browser', icon: 'browser' },
  { name: 'Google Drive', icon: 'drive' },
  { name: 'Outlook Mail', icon: 'outlook-mail' },
  { name: 'Outlook Calendar', icon: 'outlook-calendar' },
];

const MEDIUM_HEIGHT = 0.78;
const CLOSED_OFFSET = 110;

function GmailIcon() {
  return (
    <svg width="28" height="22" viewBox="0 0 256 193" fill="none" aria-hidden="true">
      <path fill="#4285F4" d="M58.18 192.05V93.14L27.1 64.64 0 49.43v125.41c0 9.5 7.7 17.21 17.21 17.21h40.97Z" />
      <path fill="#34A853" d="M197.82 192.05h40.97c9.5 0 17.21-7.7 17.21-17.21V49.43l-30.69 17.54-27.49 26.17v98.91Z" />
      <path fill="#EA4335" d="M58.18 93.14 53.95 54.2l4.23-37.29L128 69.27l69.82-52.36 4.67 35.28-4.67 40.95L128 145.5 58.18 93.14Z" />
      <path fill="#FBBC04" d="M197.82 16.91v76.23L256 49.43V25.52c0-21.25-24.26-33.36-41.22-20.61l-16.96 12Z" />
      <path fill="#C5221F" d="M0 49.43 26.75 69.5l31.43 23.64V16.91L41.22 4.91C24.26-7.84 0 4.27 0 25.52v23.91Z" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="6" width="32" height="36" rx="3" fill="#fff" />
      <path fill="#EA4335" d="M11 6h26a3 3 0 0 1 3 3v7H8V9a3 3 0 0 1 3-3Z" />
      <path fill="#4285F4" d="M8 16h8v26h-5a3 3 0 0 1-3-3V16Z" />
      <path fill="#34A853" d="M32 16h8v23a3 3 0 0 1-3 3h-5V16Z" />
      <path fill="#FBBC04" d="M16 34h16v8H16v-8Z" />
      <path fill="#fff" d="M16 16h16v18H16V16Z" />
      <text x="24" y="29.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#4285F4" fontFamily="Arial, Helvetica, sans-serif">31</text>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 98 96" fill="#000" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M48.85 0C21.9 0 0 21.9 0 48.85c0 21.57 13.98 39.86 33.37 46.31 2.44.45 3.34-1.06 3.34-2.35 0-1.16-.04-5.01-.07-9.09-13.58 2.95-16.45-5.76-16.45-5.76-2.22-5.64-5.42-7.14-5.42-7.14-4.43-3.03.34-2.97.34-2.97 4.9.35 7.48 5.03 7.48 5.03 4.35 7.46 11.42 5.3 14.2 4.05.44-3.15 1.7-5.3 3.1-6.52-10.84-1.23-22.24-5.42-22.24-24.13 0-5.33 1.9-9.69 5.03-13.1-.51-1.23-2.18-6.19.48-12.92 0 0 4.1-1.31 13.43 5.01a46.65 46.65 0 0 1 12.23-1.64c4.15.02 8.34.56 12.23 1.64 9.33-6.32 13.42-5.01 13.42-5.01 2.67 6.73.99 11.69.49 12.92 3.13 3.41 5.02 7.77 5.02 13.1 0 18.76-11.42 22.89-22.3 24.09 1.75 1.51 3.31 4.49 3.31 9.05 0 6.53-.06 11.8-.06 13.4 0 1.3.88 2.83 3.36 2.35C83.72 88.69 97.7 70.41 97.7 48.85 97.7 21.9 75.8 0 48.85 0Z" />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#fff" />
      <path d="M12 12 3.34 7a10 10 0 0 1 17.32 0H12Z" fill="#EA4335" />
      <path d="M12 12h8.66A10 10 0 0 1 12 22l-4.33-7.5L12 12Z" fill="#34A853" />
      <path d="M12 12 7.67 14.5 3.34 7A10 10 0 0 0 12 22V12Z" fill="#FBBC04" />
      <circle cx="12" cy="12" r="4.15" fill="#4285F4" stroke="#fff" strokeWidth="1.25" />
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="29" height="26" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
      <path fill="#0066DA" d="M6.6 66.85 11.52 75.33A5.34 5.34 0 0 0 16.13 78h55.04a5.34 5.34 0 0 0 4.61-2.67l4.92-8.48H6.6Z" />
      <path fill="#00AC47" d="M43.65 0H21.63a5.34 5.34 0 0 0-4.61 2.67L0 32.13l11.52 19.95L43.65 0Z" />
      <path fill="#00832D" d="M11.52 52.08 0 32.13l6.6 34.72h22.98l-18.06-14.77Z" />
      <path fill="#EA4335" d="M65.67 0H43.65l32.13 52.08L87.3 32.13 70.28 2.67A5.34 5.34 0 0 0 65.67 0Z" />
      <path fill="#FFBA00" d="M75.78 52.08 87.3 32.13 80.7 66.85H57.72l18.06-14.77Z" />
      <path fill="#2684FC" d="M29.58 66.85h28.14l18.06-14.77H11.52l18.06 14.77Z" />
      <path fill="#FFBA00" d="M43.65 0 11.52 52.08h64.26L43.65 0Z" />
    </svg>
  );
}

function OutlookMailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path fill="#0078D4" d="M26 15h27a3 3 0 0 1 3 3v28a3 3 0 0 1-3 3H26V15Z" />
      <path fill="#50D9FF" d="M38 20h18v11H38V20Z" />
      <path fill="#28A8EA" d="M38 31h18v11H38V31Z" />
      <path fill="#0364B8" d="M26 20h12v11H26V20Z" />
      <path fill="#14447D" d="M26 31h12v11H26V31Z" />
      <path fill="#0A5EBE" d="M5 19.5 30 14v38L5 46.5v-27Z" />
      <path fill="#fff" d="M10 32c0-6.6 3.75-10.75 9.2-10.75 5.5 0 9.05 4.05 9.05 10.55 0 6.65-3.65 10.9-9.15 10.9C13.65 42.7 10 38.55 10 32Zm5.75-.05c0 3.65 1.2 5.85 3.4 5.85s3.35-2.2 3.35-5.85c0-3.55-1.2-5.7-3.35-5.7-2.2 0-3.4 2.15-3.4 5.7Z" />
    </svg>
  );
}

function OutlookCalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="46" height="42" rx="4" fill="#0078D4" />
      <path fill="#28A8EA" d="M8 18a6 6 0 0 1 6-6h34a6 6 0 0 1 6 6v8H8v-8Z" />
      <path fill="#50D9FF" d="M16 32h8v8h-8v-8Zm12 0h8v8h-8v-8Zm12 0h8v8h-8v-8ZM16 43h8v8h-8v-8Zm12 0h8v8h-8v-8Z" />
      <path fill="#0A5EBE" d="M4 20.5 31 15v38L4 47.5v-27Z" />
      <path fill="#fff" d="M13 29h13v4H13v-4Zm0 8h8v4h-8v-4Z" />
    </svg>
  );
}

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'gmail') return <GmailIcon />;
  if (icon === 'google-calendar') return <GoogleCalendarIcon />;
  if (icon === 'github') return <GitHubIcon />;
  if (icon === 'browser') return <BrowserIcon />;
  if (icon === 'drive') return <DriveIcon />;
  if (icon === 'outlook-mail') return <OutlookMailIcon />;
  if (icon === 'outlook-calendar') return <OutlookCalendarIcon />;
  return null;
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calendarDetailOpen, setCalendarDetailOpen] = useState(false);
  const [gmailDetailOpen, setGmailDetailOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    setCalendarDetailOpen(false);
    setGmailDetailOpen(false);
    const frame = requestAnimationFrame(() => setIsVisible(true));
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
    setCalendarDetailOpen(false);
    setGmailDetailOpen(false);
    window.setTimeout(onClose, 180);
  }

  return (
    <div className="fixed inset-0 z-[95]">
      <button
        type="button"
        aria-label="Close connectors"
        onClick={closeWithAnimation}
        className={`absolute inset-0 bg-black/20 backdrop-blur-[3px] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        ref={sheetRef}
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-[110px]'}`}
        style={{ height: `${MEDIUM_HEIGHT * 100}vh` }}
      >
        <div className="flex h-[32px] items-center justify-center">
          <div className="h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
        </div>

        <div className="relative flex h-[56px] items-center justify-center px-[18px]">
          <button type="button" onClick={closeWithAnimation} aria-label="Close" className="absolute left-[18px] flex h-[42px] w-[42px] items-center justify-center text-[#1f2023]">
            <X size={27} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#111]">Connectors</h2>
        </div>

        <div className="h-[calc(100%-88px)] overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[22px]">
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
                <button
                  type="button"
                  onClick={() => {
                    if (connector.name === 'Google Calendar') setCalendarDetailOpen(true);
                    if (connector.name === 'Gmail') setGmailDetailOpen(true);
                  }}
                  className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]"
                >
                  <span className="flex h-[28px] w-[28px] items-center justify-center"><BrandIcon icon={connector.icon} /></span>
                  <span className="min-w-0 flex-1 truncate text-[21px] tracking-[-0.035em]">{connector.name}</span>
                  <span className="text-[20px] tracking-[-0.03em] text-[#7e7e84]">Connect</span>
                </button>
                {index < connectors.length - 1 ? <div className="ml-[46px] h-px bg-[#dddddf]" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
