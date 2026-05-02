import { KIVO_MODEL_NAMES, type KivoModelInput, type KivoModelResult } from '../models';

function removeEmptyValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')) as Partial<T>;
}

export async function runGroq(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const model = input.forceModel ?? 'groq:fast';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  const body: any = {
    model: KIVO_MODEL_NAMES[model],
    messages: input.messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? 900,
  };

  if (model === 'groq:compound' && input.webSearch) {
    const searchSettings = removeEmptyValues({
      country: input.webSearch.country,
      include_domains: input.webSearch.includeDomains,
      exclude_domains: input.webSearch.excludeDomains,
    });

    if (Object.keys(searchSettings).length > 0) body.search_settings = searchSettings;
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data?.error?.message || data?.message || `Groq request failed (${res.status})`;
      throw new Error(message);
    }

    const message = data?.choices?.[0]?.message;
    const executedTools = Array.isArray(message?.executed_tools) ? message.executed_tools : [];
    const sources = executedTools
      .flatMap((tool: any) => tool?.search_results?.results ?? [])
      .map((item: any) => ({
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score,
      }))
      .filter((item: any) => item.title || item.url || item.content);

    return {
      model,
      provider: 'groq',
      content: message?.content ?? '',
      sources: sources.length ? sources : undefined,
      raw: data,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Groq request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
