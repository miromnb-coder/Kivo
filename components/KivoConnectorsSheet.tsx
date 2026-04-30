'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Github, Globe2, Plus, SlidersHorizontal, X } from 'lucide-react';

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

const MEDIUM_HEIGHT = 0.78;
const FULL_HEIGHT = 0.92;
const CLOSED_OFFSET = 110;
const CLOSE_THRESHOLD = 130;
const VELOCITY_CLOSE_THRESHOLD = 0.65;
const VELOCITY_OPEN_THRESHOLD = -0.65;

function GmailIcon() {
  return (
    <svg width="27" height="22" viewBox="0 0 27 22" fill="none" aria-hidden="true">
      <path d="M3.2 4.3v13.4c0 .9.7 1.6 1.6 1.6h3.7V9.1L3.2 4.3Z" fill="#34A853" />
      <path d="M18.5 19.3h3.7c.9 0 1.6-.7 1.6-1.6V4.3l-5.3 4.8v10.2Z" fill="#4285F4" />
      <path d="M8.5 9.1v10.2h10V9.1L13.5 13 8.5 9.1Z" fill="#EA4335" />
      <path d="M3.2 4.3 13.5 13 23.8 4.3c-.1-.9-.8-1.6-1.6-1.6H21L13.5 9 6 2.7H4.8c-.8 0-1.5.7-1.6 1.6Z" fill="#FBBC04" />
      <path d="M3.2 4.3 13.5 13l2-1.7L6 2.7H4.8c-.8 0-1.5.7-1.6 1.6Z" fill="#EA4335" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="19" height="19" rx="2.6" fill="#fff" />
      <path d="M5.6 3h13.8A2.6 2.6 0 0 1 22 5.6v3.6H3V5.6A2.6 2.6 0 0 1 5.6 3Z" fill="#4285F4" />
      <path d="M3 9.2h4.8V22H5.6A2.6 2.6 0 0 1 3 19.4V9.2Z" fill="#34A853" />
      <path d="M17.2 9.2H22v10.2a2.6 2.6 0 0 1-2.6 2.6h-2.2V9.2Z" fill="#FBBC04" />
      <path d="M7.8 9.2h9.4V22H7.8V9.2Z" fill="#fff" />
      <text x="12.5" y="17.4" textAnchor="middle" fontSize="7.8" fontWeight="700" fill="#4285F4">31</text>
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="28" height="25" viewBox="0 0 28 25" fill="none" aria-hidden="true">
      <path d="M10.7 2h6.6L27 18.8h-6.6L10.7 2Z" fill="#FBBC04" />
      <path d="M10.7 2 1 18.8l3.3 5.7L14 7.7 10.7 2Z" fill="#34A853" />
      <path d="M4.3 24.5h19.4l3.3-5.7H7.6l-3.3 5.7Z" fill="#4285F4" />
    </svg>
  );
}

function OutlookMailIcon() {
  return (
    <svg width="28" height="25" viewBox="0 0 28 25" fill="none" aria-hidden="true">
      <rect x="8" y="5" width="18" height="15" rx="2.4" fill="#0A5BD3" />
      <path d="M10.2 7.3h13.6v2.1L17 13.7l-6.8-4.3V7.3Z" fill="#42A5F5" />
      <path d="M10.2 19.7 17 14.4l6.8 5.3H10.2Z" fill="#063B8C" opacity="0.45" />
      <rect x="2" y="3" width="14" height="19" rx="2.8" fill="#0078D4" />
      <circle cx="9" cy="12.5" r="4.3" fill="#fff" />
      <circle cx="9" cy="12.5" r="2.5" fill="#0078D4" />
    </svg>
  );
}

function OutlookCalendarIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="21" height="20" rx="4" fill="#fff" />
      <path d="M7 4h13a4 4 0 0 1 4 4v3H3V8a4 4 0 0 1 4-4Z" fill="#0078D4" />
      <path d="M3 11h21v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-9Z" fill="#2AB5E8" />
      <rect x="7" y="14" width="3" height="3" rx="0.7" fill="#fff" />
      <rect x="12" y="14" width="3" height="3" rx="0.7" fill="#fff" />
      <rect x="17" y="14" width="3" height="3" rx="0.7" fill="#fff" />
      <rect x="7" y="19" width="3" height="3" rx="0.7" fill="#fff" />
      <rect x="12" y="19" width="3" height="3" rx="0.7" fill="#fff" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="27" height="27" viewBox="0 0 27 27" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="23" height="23" rx="6.5" fill="url(#igGradient)" />
      <circle cx="13.5" cy="13.5" r="5" stroke="white" strokeWidth="2" />
      <circle cx="19.1" cy="7.9" r="1.45" fill="white" />
      <defs>
        <linearGradient id="igGradient" x1="3" y1="24" x2="24" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFDC80" />
          <stop offset="0.26" stopColor="#F77737" />
          <stop offset="0.52" stopColor="#E1306C" />
          <stop offset="0.78" stopColor="#833AB4" />
          <stop offset="1" stopColor="#405DE6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MetaIcon() {
  return (
    <svg width="32" height="22" viewBox="0 0 32 22" fill="none" aria-hidden="true">
      <path d="M2.5 13.1C2.5 8.3 5 4.2 8.35 4.2c2.35 0 4.2 1.8 6.05 4.45l1.6 2.35 1.6-2.35c1.85-2.65 3.7-4.45 6.05-4.45 3.35 0 5.85 4.1 5.85 8.9 0 3.25-1.45 5.4-3.85 5.4-2.05 0-3.55-1.4-5.65-4.45l-4-5.85-4 5.85c-2.1 3.05-3.6 4.45-5.65 4.45-2.4 0-3.85-2.15-3.85-5.4Z" stroke="#1684FF" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BrandIcon({ icon }: { icon: string }) {
  if (icon === 'github') return <Github size={25} fill="currentColor" strokeWidth={0} />;
  if (icon === 'browser') return <Globe2 size={25} strokeWidth={2.4} />;
  if (icon === 'gmail') return <GmailIcon />;
  if (icon === 'google-calendar') return <GoogleCalendarIcon />;
  if (icon === 'drive') return <DriveIcon />;
  if (icon === 'outlook-mail') return <OutlookMailIcon />;
  if (icon === 'outlook-calendar') return <OutlookCalendarIcon />;
  if (icon === 'instagram') return <InstagramIcon />;
  if (icon === 'meta') return <MetaIcon />;

  return null;
}

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [heightRatio, setHeightRatio] = useState(MEDIUM_HEIGHT);
  const [dragOffset, setDragOffset] = useState(CLOSED_OFFSET);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const liveHeightRatioRef = useRef(MEDIUM_HEIGHT);
  const liveDragOffsetRef = useRef(CLOSED_OFFSET);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(MEDIUM_HEIGHT);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  function applySheetStyle(height: number, offset: number, animated: boolean) {
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.style.transition = animated ? 'height 300ms cubic-bezier(0.16,1,0.3,1), transform 300ms cubic-bezier(0.16,1,0.3,1)' : 'none';
    sheet.style.height = `${height * 100}vh`;
    sheet.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  function scheduleSheetStyle(height: number, offset: number) {
    liveHeightRatioRef.current = height;
    liveDragOffsetRef.current = offset;

    if (frameRef.current !== null) return;

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      applySheetStyle(liveHeightRatioRef.current, liveDragOffsetRef.current, false);
    });
  }

  useEffect(() => {
    if (!open) return;

    liveHeightRatioRef.current = MEDIUM_HEIGHT;
    liveDragOffsetRef.current = CLOSED_OFFSET;
    setHeightRatio(MEDIUM_HEIGHT);
    setDragOffset(CLOSED_OFFSET);
    setIsDragging(false);
    setIsVisible(false);

    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
      liveDragOffsetRef.current = 0;
      setDragOffset(0);
      applySheetStyle(MEDIUM_HEIGHT, 0, true);
    });

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      cancelAnimationFrame(frame);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
    liveDragOffsetRef.current = CLOSED_OFFSET;
    setDragOffset(CLOSED_OFFSET);
    applySheetStyle(liveHeightRatioRef.current, CLOSED_OFFSET, true);
    window.setTimeout(onClose, 180);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartYRef.current = event.clientY;
    dragStartHeightRef.current = liveHeightRatioRef.current;
    lastYRef.current = event.clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    setIsDragging(true);
    applySheetStyle(liveHeightRatioRef.current, liveDragOffsetRef.current, false);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    const now = performance.now();
    const delta = event.clientY - dragStartYRef.current;
    const deltaTime = Math.max(1, now - lastTimeRef.current);
    velocityRef.current = (event.clientY - lastYRef.current) / deltaTime;
    lastYRef.current = event.clientY;
    lastTimeRef.current = now;

    const viewportHeight = window.innerHeight || 800;
    const heightDelta = -delta / viewportHeight;
    const nextHeight = Math.min(FULL_HEIGHT, Math.max(MEDIUM_HEIGHT, dragStartHeightRef.current + heightDelta));

    if (delta > 0 && dragStartHeightRef.current <= MEDIUM_HEIGHT + 0.02) {
      scheduleSheetStyle(MEDIUM_HEIGHT, Math.min(delta * 0.92, 210));
      return;
    }

    scheduleSheetStyle(nextHeight, 0);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);

    const totalDelta = event.clientY - dragStartYRef.current;
    const velocity = velocityRef.current;

    if (totalDelta > CLOSE_THRESHOLD || velocity > VELOCITY_CLOSE_THRESHOLD) {
      closeWithAnimation();
      return;
    }

    let targetHeight = MEDIUM_HEIGHT;

    if (velocity < VELOCITY_OPEN_THRESHOLD) {
      targetHeight = FULL_HEIGHT;
    } else if (liveHeightRatioRef.current > (MEDIUM_HEIGHT + FULL_HEIGHT) / 2) {
      targetHeight = FULL_HEIGHT;
    }

    liveHeightRatioRef.current = targetHeight;
    liveDragOffsetRef.current = 0;
    setHeightRatio(targetHeight);
    setDragOffset(0);
    applySheetStyle(targetHeight, 0, true);
  }

  return (
    <div className="fixed inset-0 z-[95]">
      <button type="button" aria-label="Close connectors" onClick={closeWithAnimation} className={`absolute inset-0 bg-black/20 backdrop-blur-[3px] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />

      <div
        ref={sheetRef}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.12)] will-change-transform"
        style={{ height: `${heightRatio * 100}vh`, transform: `translate3d(0, ${dragOffset}px, 0)` }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Drag connectors sheet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex h-[32px] cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        >
          <div className="h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
        </div>

        <div className="relative flex h-[56px] items-center justify-center px-[18px]">
          <button type="button" onClick={closeWithAnimation} aria-label="Close" className="absolute left-[18px] flex h-[42px] w-[42px] items-center justify-center text-[#1f2023]">
            <X size={27} strokeWidth={2} />
          </button>
          <h2 className="text-[22px] font-semibold tracking-[-0.035em] text-[#111]">Connectors</h2>
        </div>

        <div className="h-[calc(100%-88px)] overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[22px] overscroll-contain">
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
