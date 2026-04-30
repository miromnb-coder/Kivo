import { KIVO_MODEL_NAMES, type KivoModelInput, type KivoModelResult } from '../models';

export async function runGroq(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIVO_MODEL_NAMES['groq:fast'],
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 800,
    }),
  });

  const data = await res.json();

  return {
    model: 'groq:fast',
    provider: 'groq',
    content: data?.choices?.[0]?.message?.content ?? '',
    raw: data,
  };
}
