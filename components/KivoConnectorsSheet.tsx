'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Github, Globe2, Plus, SlidersHorizontal, X } from 'lucide-react';
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
  return <svg width="27" height="22" viewBox="0 0 27 22" fill="none"><path d="M3.2 4.3v13.4c0 .9.7 1.6 1.6 1.6h3.7V9.1L3.2 4.3Z" fill="#34A853"/><path d="M18.5 19.3h3.7c.9 0 1.6-.7 1.6-1.6V4.3l-5.3 4.8v10.2Z" fill="#4285F4"/><path d="M8.5 9.1v10.2h10V9.1L13.5 13 8.5 9.1Z" fill="#EA4335"/><path d="M3.2 4.3 13.5 13 23.8 4.3c-.1-.9-.8-1.6-1.6-1.6H21L13.5 9 6 2.7H4.8c-.8 0-1.5.7-1.6 1.6Z" fill="#FBBC04"/></svg>;
}

function GoogleCalendarIcon() {
  return <svg width="25" height="25" viewBox="0 0 25 25" fill="none"><rect x="3" y="3" width="19" height="19" rx="2.6" fill="#fff"/><path d="M5.6 3h13.8A2.6 2.6 0 0 1 22 5.6v3.6H3V5.6A2.6 2.6 0 0 1 5.6 3Z" fill="#4285F4"/><path d="M3 9.2h4.8V22H5.6A2.6 2.6 0 0 1 3 19.4V9.2Z" fill="#34A853"/><path d="M17.2 9.2H22v10.2a2.6 2.6 0 0 1-2.6 2.6h-2.2V9.2Z" fill="#FBBC04"/><path d="M7.8 9.2h9.4V22H7.8V9.2Z" fill="#fff"/><text x="12.5" y="17.4" textAnchor="middle" fontSize="7.8" fontWeight="700" fill="#4285F4">31</text></svg>;
}

function DriveIcon() {
  return <svg width="28" height="25" viewBox="0 0 28 25" fill="none"><path d="M10.7 2h6.6L27 18.8h-6.6L10.7 2Z" fill="#FBBC04"/><path d="M10.7 2 1 18.8l3.3 5.7L14 7.7 10.7 2Z" fill="#34A853"/><path d="M4.3 24.5h19.4l3.3-5.7H7.6l-3.3 5.7Z" fill="#4285F4"/></svg>;
}

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'gmail') return <GmailIcon />;
  if (icon === 'google-calendar') return <GoogleCalendarIcon />;
  if (icon === 'github') return <Github size={25} fill="currentColor" strokeWidth={0} />;
  if (icon === 'browser') return <Globe2 size={25} strokeWidth={2.4} />;
  if (icon === 'drive') return <DriveIcon />;
  return <div className="h-[24px] w-[24px] rounded-[7px] bg-[#d8d8dc]" />;
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
