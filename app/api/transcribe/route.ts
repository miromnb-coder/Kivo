import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GROQ_TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
const MAX_AUDIO_SIZE_BYTES = 24 * 1024 * 1024;

function getAudioFilename(file: File) {
  const name = file.name?.trim();
  if (name) return name;

  const type = file.type || 'audio/webm';
  if (type.includes('mp4')) return 'kivo-voice.m4a';
  if (type.includes('mpeg')) return 'kivo-voice.mp3';
  if (type.includes('ogg')) return 'kivo-voice.ogg';
  if (type.includes('wav')) return 'kivo-voice.wav';
  return 'kivo-voice.webm';
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'GROQ_API_KEY is missing.' }, { status: 500 });
    }

    const incomingForm = await req.formData();
    const audio = incomingForm.get('audio');
    const language = typeof incomingForm.get('language') === 'string' ? String(incomingForm.get('language')).trim() : '';

    if (!(audio instanceof File)) {
      return NextResponse.json({ ok: false, error: 'Audio file is required.' }, { status: 400 });
    }

    if (audio.size <= 0) {
      return NextResponse.json({ ok: false, error: 'Audio file is empty.' }, { status: 400 });
    }

    if (audio.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Audio file is too large.' }, { status: 413 });
    }

    const groqForm = new FormData();
    groqForm.append('file', audio, getAudioFilename(audio));
    groqForm.append('model', GROQ_TRANSCRIPTION_MODEL);
    groqForm.append('response_format', 'json');
    groqForm.append('temperature', '0');
    if (language) groqForm.append('language', language);

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || 'Transcription failed.';
      return NextResponse.json({ ok: false, error: message }, { status: response.status });
    }

    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    return NextResponse.json({ ok: true, text, model: GROQ_TRANSCRIPTION_MODEL });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Transcription failed.' },
      { status: 500 },
    );
  }
}
