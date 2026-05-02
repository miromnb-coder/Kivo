import { KIVO_MODEL_NAMES, type KivoModelInput, type KivoModelResult } from '../models';

export async function runGroq(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const model = input.forceModel ?? 'groq:fast';

  const body: any = {
    model: KIVO_MODEL_NAMES[model],
    messages: input.messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? 800,
  };

  // Add web search settings ONLY for compound model
  if (model === 'groq:compound' && input.webSearch) {
    body.search_settings = {
      country: input.webSearch.country,
      include_domains: input.webSearch.includeDomains,
      exclude_domains: input.webSearch.excludeDomains,
    };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  const message = data?.choices?.[0]?.message;

  let sources: any[] | undefined;

  // Extract web search sources if available
  if (message?.executed_tools?.[0]?.search_results?.results) {
    sources = message.executed_tools[0].search_results.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  }

  return {
    model,
    provider: 'groq',
    content: message?.content ?? '',
    sources,
    raw: data,
  };
}
