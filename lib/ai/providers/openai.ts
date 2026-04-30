import { KIVO_MODEL_NAMES, type KivoModelInput, type KivoModelResult } from '../models';

export async function runOpenAI(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIVO_MODEL_NAMES['openai:gpt-5.4-mini'],
      messages: input.messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 1200,
    }),
  });

  const data = await res.json();

  return {
    model: 'openai:gpt-5.4-mini',
    provider: 'openai',
    content: data?.choices?.[0]?.message?.content ?? '',
    raw: data,
  };
}
