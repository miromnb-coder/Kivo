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
      <path fill="#fff" d="M13 13h22v22H13z" />
      <path fill="#1A73E8" d="M35 6H13c-3.86 0-7 3.14-7 7v22c0 3.86 3.14 7 7 7h22c3.86 0 7-3.14 7-7V13c0-3.86-3.14-7-7-7Zm0 29H13V18h22v17Z" />
      <path fill="#EA4335" d="M35 6H13c-3.86 0-7 3.14-7 7v5h36v-5c0-3.86-3.14-7-7-7Z" />
      <path fill="#FBBC04" d="M35 42h7V18h-7v24Z" />
      <path fill="#34A853" d="M6 18v17c0 3.86 3.14 7 7 7h5V18H6Z" />
      <path fill="#4285F4" d="M18 42h17v-7H18v7Z" />
      <text x="24" y="31.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1A73E8" fontFamily="Arial, Helvetica, sans-serif">31</text>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#24292F" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18A10.98 10.98 0 0 1 12 6.07c.98 0 1.96.13 2.88.38 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.42.36.78 1.07.78 2.16v3.13c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#202124" strokeWidth="1.8" />
      <path d="M2.8 9h18.4M2.8 15h18.4" stroke="#202124" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 2.4c2.2 2.35 3.4 5.6 3.4 9.6s-1.2 7.25-3.4 9.6C9.8 19.25 8.6 16 8.6 12S9.8 4.75 12 2.4Z" stroke="#202124" strokeWidth="1.8" strokeLinejoin="round" />
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

function OutlookIcon({ calendar = false }: { calendar?: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path fill="#0A5EBE" d="M28 12h28a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H28V12Z" />
      <path fill="#0078D4" d="M28 16h18v12H28V16Z" />
      <path fill="#28A8EA" d="M46 16h10v12H46V16Z" />
      <path fill="#50D9FF" d="M46 28h10v12H46V28Z" />
      <path fill="#0364B8" d="M28 28h18v12H28V28Z" />
      <path fill="#14447D" d="M28 40h28v8H28v-8Z" />
      <path fill="#0A5EBE" d="M4 18.5 31 13v38L4 45.5v-27Z" />
      <path fill="#fff" d={calendar ? 'M15 25h10v3H15v-3Zm0 6h5v3h-5v-3Zm8 0h5v3h-5v-3Zm-8 6h5v3h-5v-3Zm8 0h5v3h-5v-3Z' : 'M10 25.5c0-5.3 3.25-8.8 8.1-8.8 4.9 0 8 3.5 8 8.7 0 5.35-3.2 8.9-8.1 8.9-4.85 0-8-3.5-8-8.8Zm5.1-.05c0 2.95 1.1 4.8 3 4.8s3-1.85 3-4.8c0-2.9-1.1-4.7-3-4.7s-3 1.8-3 4.7Z'} />
    </svg>
  );
}

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'gmail') return <GmailIcon />;
  if (icon === 'google-calendar') return <GoogleCalendarIcon />;
  if (icon === 'github') return <GitHubIcon />;
  if (icon === 'browser') return <BrowserIcon />;
  if (icon === 'drive') return <DriveIcon />;
  if (icon === 'outlook-mail') return <OutlookIcon />;
  if (icon === 'outlook-calendar') return <OutlookIcon calendar />;
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
