'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  Camera,
  ImageIcon,
  Mic2,
  Monitor,
  Paperclip,
  Puzzle,
  Search,
  Sparkles,
  Table2,
  Video,
  Wand2,
  MessageSquare,
  LayoutPanelTop,
} from 'lucide-react';

type KivoPlusSheetProps = {
  open: boolean;
  onClose: () => void;
};

const actions = [
  { label: 'Add files', icon: Paperclip },
  { label: 'Connect My Computer', icon: Monitor },
  { label: 'Add Skills', icon: Puzzle },
  { label: 'Build website', icon: LayoutPanelTop },
  { label: 'Create slides', icon: Briefcase },
  { label: 'Create image', icon: ImageIcon, badge: 'Images 2.0' },
  { label: 'Edit image', icon: Wand2 },
  { label: 'Wide Research', icon: Search },
  { label: 'Chat mode', icon: MessageSquare },
  { label: 'Scheduled tasks', icon: CalendarDays },
  { label: 'Create spreadsheet', icon: Table2 },
  { label: 'Create video', icon: Video },
  { label: 'Generate audio', icon: Mic2 },
];

const photoItems = [
  { type: 'camera' as const },
  { title: 'How can I help you today?', duration: '0:13' },
  { title: 'What can I do for you?', duration: '0:09' },
  { title: 'Ask anything or assign a task' },
];

const MEDIUM_HEIGHT = 0.62;
const FULL_HEIGHT = 0.92;
const CLOSED_OFFSET = 110;
const CLOSE_THRESHOLD = 130;
const VELOCITY_CLOSE_THRESHOLD = 0.65;
const VELOCITY_OPEN_THRESHOLD = -0.65;

export function KivoPlusSheet({ open, onClose }: KivoPlusSheetProps) {
  const [heightRatio, setHeightRatio] = useState(MEDIUM_HEIGHT);
  const [dragOffset, setDragOffset] = useState(CLOSED_OFFSET);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(MEDIUM_HEIGHT);
  const dragStartTimeRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    setHeightRatio(MEDIUM_HEIGHT);
    setDragOffset(CLOSED_OFFSET);
    setIsDragging(false);
    setIsVisible(false);

    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
      setDragOffset(0);
    });

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [open]);

  if (!open) return null;

  function closeWithAnimation() {
    setIsVisible(false);
    setDragOffset(CLOSED_OFFSET);
    window.setTimeout(onClose, 180);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartYRef.current = event.clientY;
    dragStartHeightRef.current = heightRatio;
    dragStartTimeRef.current = performance.now();
    lastYRef.current = event.clientY;
    lastTimeRef.current = dragStartTimeRef.current;
    velocityRef.current = 0;
    setIsDragging(true);
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
      setDragOffset(Math.min(delta * 0.92, 210));
      setHeightRatio(MEDIUM_HEIGHT);
      return;
    }

    setDragOffset(0);
    setHeightRatio(nextHeight);
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

    setDragOffset(0);

    if (velocity < VELOCITY_OPEN_THRESHOLD) {
      setHeightRatio(FULL_HEIGHT);
      return;
    }

    if (heightRatio > (MEDIUM_HEIGHT + FULL_HEIGHT) / 2) {
      setHeightRatio(FULL_HEIGHT);
    } else {
      setHeightRatio(MEDIUM_HEIGHT);
    }
  }

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close actions"
        onClick={closeWithAnimation}
        className={`absolute inset-0 bg-black/20 backdrop-blur-[3px] transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-16px_40px_rgba(0,0,0,0.12)] ${
          isDragging ? '' : 'transition-[height,transform] duration-[420ms] ease-[cubic-bezier(0.22,1.25,0.36,1)]'
        }`}
        style={{
          height: `${heightRatio * 100}vh`,
          transform: `translate3d(0, ${dragOffset}px, 0)`,
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Drag actions sheet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="flex h-[32px] cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        >
          <div className="h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
        </div>

        <div className="h-[calc(100%-32px)] overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+18px)] pt-[0px] overscroll-contain">
          <div className="mb-[18px] flex items-center justify-between">
            <h2 className="text-[28px] font-semibold leading-none tracking-[-0.035em] text-[#25262a]">Photos</h2>
            <button type="button" className="text-[22px] font-semibold tracking-[-0.03em] text-[#0a84ff]">
              See all
            </button>
          </div>

          <div className="flex gap-[16px] overflow-x-auto pb-[22px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {photoItems.map((item, index) => {
              if ('type' in item) {
                return (
                  <button
                    type="button"
                    key="camera"
                    className="flex h-[98px] min-w-[98px] flex-col items-center justify-center rounded-[20px] bg-[#f1f1f2] text-[#2b2c30]"
                  >
                    <Camera size={28} strokeWidth={2.4} />
                    <span className="mt-[12px] text-[19px] tracking-[-0.03em]">Camera</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  key={`${item.title}-${index}`}
                  className="relative h-[98px] min-w-[98px] overflow-hidden rounded-[20px] border border-[#ececef] bg-[#f8f6f8]"
                >
                  <span className="absolute right-[7px] top-[7px] h-[18px] w-[18px] rounded-full bg-[#dedee2] ring-2 ring-white/80" />
                  <span className="absolute inset-x-[12px] top-[34px] text-center text-[8px] leading-[1.2] text-[#2b2c30]">
                    {item.title}
                  </span>
                  {item.duration ? (
                    <span className="absolute bottom-[8px] left-[8px] text-[16px] font-semibold tracking-[-0.04em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                      {item.duration}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-[#e7e7ea]" />

          <div className="pt-[24px]">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  type="button"
                  key={action.label}
                  className="flex min-h-[58px] w-full items-center gap-[22px] text-left text-[#2b2c30]"
                >
                  <span className="flex h-[34px] w-[34px] items-center justify-center">
                    <Icon size={29} strokeWidth={2} />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-[10px] text-[24px] font-normal leading-none tracking-[-0.045em]">
                    <span>{action.label}</span>
                    {action.badge ? (
                      <span className="inline-flex h-[32px] items-center gap-[6px] rounded-[11px] bg-[#f1f1f2] px-[10px] text-[16px] tracking-[-0.03em] text-[#333438]">
                        <Sparkles size={16} strokeWidth={2} />
                        {action.badge}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
