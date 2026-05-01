'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { KivoCalendarConnectorDetail } from './KivoCalendarConnectorDetail';
import { KivoConnectorDetail } from './KivoConnectorDetail';
import { KivoGmailConnectorDetail } from './KivoGmailConnectorDetail';

type KivoConnectorsSheetProps = {
  open: boolean;
  onClose: () => void;
};

type ConnectorIconId = 'gmail' | 'google-calendar' | 'github' | 'browser' | 'drive' | 'outlook-mail' | 'outlook-calendar';

type ConnectorItem = {
  name: string;
  icon: ConnectorIconId;
};

const connectors: ConnectorItem[] = [
  { name: 'Gmail', icon: 'gmail' },
  { name: 'Google Calendar', icon: 'google-calendar' },
  { name: 'GitHub', icon: 'github' },
  { name: 'My browser', icon: 'browser' },
  { name: 'Google Drive', icon: 'drive' },
  { name: 'Outlook Mail', icon: 'outlook-mail' },
  { name: 'Outlook Calendar', icon: 'outlook-calendar' },
];

const connectorDetails: Record<ConnectorIconId, { title: string; description: string; connectorType: string; author: string; buttonLabel: string }> = {
  gmail: {
    title: 'Gmail',
    description: 'Connect Gmail to Kivo to understand your inbox intelligently. See important emails, find receipts, and keep your tasks on track.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Gmail',
  },
  'google-calendar': {
    title: 'Google Calendar',
    description: 'Connect your calendar to Kivo to manage your schedule intelligently. See your events, find the best time for tasks, and keep your day on track.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Calendar',
  },
  github: {
    title: 'GitHub',
    description: 'Connect GitHub so Kivo can help understand repositories, inspect code, summarize issues, and prepare safe development tasks.',
    connectorType: 'Developer tool',
    author: 'GitHub',
    buttonLabel: 'Connect GitHub',
  },
  browser: {
    title: 'My Browser',
    description: 'Install and enable a Chrome extension so Kivo can use your local browser for tasks that require logged-in pages or heightened security.',
    connectorType: 'Browser extension',
    author: 'Kivo',
    buttonLabel: 'Connect',
  },
  drive: {
    title: 'Google Drive',
    description: 'Connect Google Drive so Kivo can help find, understand, and summarize your files and documents when you ask.',
    connectorType: 'App',
    author: 'Google',
    buttonLabel: 'Connect Google Drive',
  },
  'outlook-mail': {
    title: 'Outlook Mail',
    description: 'Connect Outlook Mail so Kivo can help understand your Microsoft inbox, surface important messages, and summarize email context.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Mail',
  },
  'outlook-calendar': {
    title: 'Outlook Calendar',
    description: 'Connect Outlook Calendar so Kivo can help understand your Microsoft schedule, events, availability, and daily planning.',
    connectorType: 'App',
    author: 'Microsoft',
    buttonLabel: 'Connect Outlook Calendar',
  },
};

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
      <circle cx="12" cy="12" r="9" stroke="#3b3b3f" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="3.7" stroke="#3b3b3f" strokeWidth="1.9" />
      <path d="M12 8.3h8.1M8.75 13.85 4.7 6.85M8.78 13.9 4.7 20.9" stroke="#3b3b3f" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="29" height="26" viewBox="0 0 64 56" fill="none" aria-hidden="true">
      <path fill="#1E8E3E" d="M23.2 2h17.6L64 42.2H46.4L23.2 2Z" />
      <path fill="#F9AB00" d="M40.8 2 64 42.2H46.4L23.2 2h17.6Z" />
      <path fill="#34A853" d="M23.2 2 0 42.2l8.8 15.2L32 17.2 23.2 2Z" />
      <path fill="#4285F4" d="M8.8 57.4h46.4L64 42.2H17.6L8.8 57.4Z" />
    </svg>
  );
}

function OutlookMailIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="outlookMailBack" x1="30" y1="13" x2="58" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#47D3FF" />
          <stop offset="1" stopColor="#0A63D8" />
        </linearGradient>
        <linearGradient id="outlookMailFront" x1="7" y1="18" x2="30" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#32A8FF" />
          <stop offset="1" stopColor="#0057C2" />
        </linearGradient>
      </defs>
      <rect x="25" y="14" width="34" height="36" rx="4" fill="url(#outlookMailBack)" />
      <path d="M25 24 42 35l17-11v22a4 4 0 0 1-4 4H25V24Z" fill="#0A5EBE" opacity=".55" />
      <path d="M5 19.5 31 14v38L5 46.5v-27Z" fill="url(#outlookMailFront)" />
      <path fill="#fff" d="M10.5 32c0-6.5 3.7-10.6 9.05-10.6 5.4 0 8.9 4 8.9 10.4 0 6.55-3.6 10.75-9 10.75-5.35 0-8.95-4.1-8.95-10.55Zm5.65-.05c0 3.55 1.17 5.7 3.35 5.7 2.15 0 3.3-2.15 3.3-5.7 0-3.48-1.15-5.58-3.3-5.58-2.18 0-3.35 2.1-3.35 5.58Z" />
    </svg>
  );
}

function OutlookCalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="outlookCalendarIcon" x1="8" y1="10" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37C8FF" />
          <stop offset="1" stopColor="#0A63D8" />
        </linearGradient>
      </defs>
      <rect x="8" y="11" width="48" height="43" rx="7" fill="url(#outlookCalendarIcon)" />
      <path fill="#D7F4FF" d="M18 28h6v6h-6v-6Zm11 0h6v6h-6v-6Zm11 0h6v6h-6v-6ZM18 39h6v6h-6v-6Zm11 0h6v6h-6v-6Zm11 0h6v6h-6v-6Z" />
      <path fill="#B9EEFF" d="M15 20h34v3H15v-3Z" opacity=".9" />
    </svg>
  );
}

function BrandIcon({ icon, large = false }: { icon: ConnectorIconId; large?: boolean }) {
  const scaleClass = large ? 'scale-[1.55]' : '';
  return <span className={`flex h-full w-full items-center justify-center ${scaleClass}`}>{icon === 'gmail' ? <GmailIcon /> : icon === 'google-calendar' ? <GoogleCalendarIcon /> : icon === 'github' ? <GitHubIcon /> : icon === 'browser' ? <BrowserIcon /> : icon === 'drive' ? <DriveIcon /> : icon === 'outlook-mail' ? <OutlookMailIcon /> : <OutlookCalendarIcon />}</span>;
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [calendarDetailOpen, setCalendarDetailOpen] = useState(false);
  const [gmailDetailOpen, setGmailDetailOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorItem | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const selectedConnectorDetail = useMemo(() => {
    if (!selectedConnector) return null;
    return connectorDetails[selectedConnector.icon];
  }, [selectedConnector]);

  useEffect(() => {
    if (!open) return;
    setIsVisible(false);
    setCalendarDetailOpen(false);
    setGmailDetailOpen(false);
    setSelectedConnector(null);
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
    setSelectedConnector(null);
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
                    if (connector.name === 'Google Calendar') {
                      setCalendarDetailOpen(true);
                      return;
                    }
                    if (connector.name === 'Gmail') {
                      setGmailDetailOpen(true);
                      return;
                    }
                    setSelectedConnector(connector);
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

      {selectedConnector && selectedConnectorDetail ? (
        <KivoConnectorDetail
          open
          onBack={() => setSelectedConnector(null)}
          onClose={closeWithAnimation}
          icon={<BrandIcon icon={selectedConnector.icon} large />}
          title={selectedConnectorDetail.title}
          description={selectedConnectorDetail.description}
          connectorType={selectedConnectorDetail.connectorType}
          author={selectedConnectorDetail.author}
          buttonLabel={selectedConnectorDetail.buttonLabel}
        />
      ) : null}
      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
