'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

type KivoVoiceRecorderBarProps = {
  open: boolean;
  seconds: number;
  onCancel: () => void;
  onConfirm: (audioBlob?: Blob) => void;
};

const BAR_COUNT = 28;
const IDLE_WAVEFORM = [8, 10, 9, 11, 8, 10, 9, 12, 10, 8, 14, 22, 28, 18, 12, 24, 16, 11, 9, 12, 10, 8, 9, 11, 8, 10, 9, 8];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function KivoVoiceRecorderBar({ open, seconds, onCancel, onConfirm }: KivoVoiceRecorderBarProps) {
  const [waveform, setWaveform] = useState(IDLE_WAVEFORM);
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function startAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];
        setAudioBlob(undefined);

        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const type = recorder.mimeType || 'audio/webm';
          setAudioBlob(new Blob(chunksRef.current, { type }));
        };

        recorder.start();

        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        function renderWaveform() {
          analyser.getByteFrequencyData(data);
          const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
          const next = Array.from({ length: BAR_COUNT }, (_, index) => {
            let sum = 0;
            for (let i = 0; i < step; i += 1) sum += data[index * step + i] ?? 0;
            const level = sum / step / 255;
            const boost = index > 9 && index < 17 ? 1.15 : 0.82;
            return Math.max(7, Math.min(30, 7 + level * 34 * boost));
          });
          setWaveform(next);
          animationRef.current = requestAnimationFrame(renderWaveform);
        }

        renderWaveform();
      } catch (error) {
        console.error('Unable to start microphone recording', error);
        setWaveform(IDLE_WAVEFORM);
      }
    }

    startAudio();

    return () => {
      cancelled = true;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      setWaveform(IDLE_WAVEFORM);
    };
  }, [open]);

  if (!open) return null;

  function handleCancel() {
    onCancel();
  }

  function handleConfirm() {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.onstop = () => {
        const type = recorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        onConfirm(blob);
      };
      recorderRef.current.stop();
      return;
    }

    onConfirm(audioBlob);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-[16px] pb-[18px] pointer-events-none">
      <div className="mx-auto flex h-[92px] w-full max-w-[430px] items-center rounded-[32px] border border-[#eeeeF1] bg-white/95 px-[14px] shadow-[0_12px_36px_rgba(0,0,0,0.06)] backdrop-blur-[18px] pointer-events-auto">
        <button type="button" aria-label="Cancel recording" onClick={handleCancel} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-[#ececef] bg-[#f8f8f9] text-[#1f2023]">
          <X size={23} strokeWidth={1.9} />
        </button>

        <div className="mx-[22px] flex min-w-0 flex-1 items-center justify-center gap-[5px] overflow-hidden">
          {waveform.map((height, index) => (
            <span
              key={index}
              className={`block w-[4px] shrink-0 rounded-full transition-[height] duration-75 ${index >= 10 && index <= 16 ? 'bg-[#1f2023]' : 'bg-[#c9c9ce]'}`}
              style={{ height }}
            />
          ))}
        </div>

        <div className="mr-[12px] text-[22px] font-normal leading-none tracking-[-0.04em] text-[#5f6066]">{formatTime(seconds)}</div>

        <button type="button" aria-label="Confirm recording" onClick={handleConfirm} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#1f2023] text-white shadow-[0_10px_22px_rgba(0,0,0,0.16)]">
          <Check size={25} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}
