'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

type KivoVoiceRecorderBarProps = {
  open: boolean;
  seconds: number;
  transcribing?: boolean;
  onCancel: () => void;
  onConfirm: (audioBlob?: Blob) => void;
};

const BAR_COUNT = 26;
const IDLE_WAVEFORM = [18, 19, 17, 20, 18, 19, 17, 20, 18, 19, 17, 20, 18, 19, 17, 20, 18, 19, 17, 20, 18, 19, 17, 20, 18, 17];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function KivoVoiceRecorderBar({ open, seconds, transcribing = false, onCancel, onConfirm }: KivoVoiceRecorderBarProps) {
  const [waveform, setWaveform] = useState(IDLE_WAVEFORM);
  const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
  const [recorderReady, setRecorderReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const confirmPendingRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setRecorderReady(false);
    setAudioBlob(undefined);
    setWaveform(IDLE_WAVEFORM);
    confirmPendingRef.current = false;

    async function startAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
        const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };

        recorder.onstop = () => {
          const type = recorder.mimeType || preferredType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type });
          setAudioBlob(blob);
          stopStream(streamRef.current);
          streamRef.current = null;

          if (confirmPendingRef.current) {
            confirmPendingRef.current = false;
            onConfirmRef.current(blob);
          }
        };

        recorder.start(250);
        setRecorderReady(true);

        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        function renderWaveform() {
          analyser.getByteFrequencyData(data);
          const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
          const next = Array.from({ length: BAR_COUNT }, (_, index) => {
            let sum = 0;
            for (let i = 0; i < step; i += 1) sum += data[index * step + i] ?? 0;
            const level = sum / step / 255;
            return Math.max(16, Math.min(28, 16 + level * 24));
          });
          setWaveform(next);
          animationRef.current = requestAnimationFrame(renderWaveform);
        }

        renderWaveform();
      } catch (error) {
        console.error('Unable to start microphone recording', error);
        setRecorderReady(false);
        setWaveform(IDLE_WAVEFORM);
      }
    }

    startAudio();

    return () => {
      cancelled = true;
      confirmPendingRef.current = false;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      recorderRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
      setRecorderReady(false);
      setWaveform(IDLE_WAVEFORM);
    };
  }, [open]);

  if (!open) return null;

  function handleCancel() {
    confirmPendingRef.current = false;
    onCancel();
  }

  function handleConfirm() {
    if (transcribing) return;

    if (recorderRef.current?.state === 'recording') {
      confirmPendingRef.current = true;
      recorderRef.current.requestData();
      recorderRef.current.stop();
      return;
    }

    onConfirm(audioBlob);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-[16px] pb-[64px] pointer-events-none">
      <div className="relative mx-auto h-[116px] w-full max-w-[430px] overflow-hidden rounded-[40px] border border-black/[0.035] bg-[#fbfbfc] shadow-[0_10px_30px_rgba(0,0,0,0.035)] pointer-events-auto">
        <div className="absolute left-[148px] right-[30px] top-[22px] flex h-[31px] items-center justify-end overflow-hidden">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden">
            {waveform.map((height, index) => (
              <span
                key={index}
                className={`block w-[3px] shrink-0 rounded-full transition-[height,opacity] duration-100 ${transcribing ? 'animate-pulse bg-[#a2a2a7]' : 'bg-[#b7b7bc]'}`}
                style={{ height }}
              />
            ))}
            <span className="ml-[8px] h-[26px] w-px shrink-0 rounded-full bg-[#c7c7cb]" />
          </div>

          <div className="ml-[14px] min-w-[58px] text-right text-[28px] font-normal leading-none tracking-[-0.055em] text-[#5f6066]">
            {transcribing ? '...' : formatTime(seconds)}
          </div>
        </div>

        <button
          type="button"
          aria-label="Cancel recording"
          onClick={handleCancel}
          disabled={transcribing}
          className="absolute bottom-[16px] left-[16px] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#f1f1f3] text-[#202024] transition active:scale-[0.96] disabled:opacity-60"
        >
          <X size={27} strokeWidth={1.9} />
        </button>

        <button
          type="button"
          aria-label="Confirm recording"
          onClick={handleConfirm}
          disabled={transcribing || !recorderReady}
          className="absolute bottom-[16px] right-[16px] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#f1f1f3] text-[#202024] transition active:scale-[0.96] disabled:opacity-60"
        >
          <Check size={29} strokeWidth={1.9} />
        </button>
      </div>
    </div>
  );
}
