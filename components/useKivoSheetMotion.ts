'use client';

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

type Options = {
  visible: boolean;
  onClose: () => void;
};

const CLOSE_DISTANCE = 82;
const CLOSE_SPEED = 0.62;
const UP_RESISTANCE = 0.16;
const UP_LIMIT = -18;

export function useKivoSheetMotion({ visible, onClose }: Options) {
  const [offset, setOffset] = useState(0);
  const [moving, setMoving] = useState(false);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const speedRef = useRef(0);

  function reset() {
    setMoving(false);
    setOffset(0);
    currentYRef.current = 0;
  }

  function start(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setMoving(true);
    startYRef.current = event.clientY;
    currentYRef.current = 0;
    lastYRef.current = event.clientY;
    lastTimeRef.current = performance.now();
    speedRef.current = 0;
  }

  function move(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!moving) return;

    const now = performance.now();
    const rawDelta = event.clientY - startYRef.current;
    const nextOffset = rawDelta < 0 ? Math.max(rawDelta * UP_RESISTANCE, UP_LIMIT) : rawDelta;
    const timeDelta = now - lastTimeRef.current;

    if (timeDelta > 0) {
      speedRef.current = (event.clientY - lastYRef.current) / timeDelta;
    }

    currentYRef.current = nextOffset;
    lastYRef.current = event.clientY;
    lastTimeRef.current = now;
    setOffset(nextOffset);
  }

  function end(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setMoving(false);

    if (currentYRef.current > CLOSE_DISTANCE || speedRef.current > CLOSE_SPEED) {
      reset();
      onClose();
      return;
    }

    reset();
  }

  const style: CSSProperties = {
    WebkitOverflowScrolling: 'touch',
    transform: visible ? `translate3d(0, ${offset}px, 0)` : 'translate3d(0, 100%, 0)',
  };

  return {
    moving,
    reset,
    style,
    handleProps: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerCancel: end,
    },
  };
}
