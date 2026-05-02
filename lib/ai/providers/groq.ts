import { KIVO_MODEL_NAMES, type KivoModelInput, type KivoModelResult, type KivoWebSource } from '../models';

function removeEmptyValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')) as Partial<T>;
}

function compactSource(source: KivoWebSource): KivoWebSource {
  return {
    title: source.title?.slice(0, 140),
    url: source.url,
    content: source.content?.slice(0, 260),
    score: source.score,
  };
}

function parseSourcesFromToolOutput(output?: string): KivoWebSource[] {
  if (!output || typeof output !== 'string') return [];

  const chunks = output.split(/\n(?=Title: )/g);

  return chunks
    .map((chunk) => {
      const title = chunk.match(/Title:\s*(.+)/)?.[1]?.trim();
      const url = chunk.match(/URL:\s*(.+)/)?.[1]?.trim() || chunk.match(/Link:\s*(.+)/)?.[1]?.trim();
      const content = chunk
        .replace(/Title:\s*.+/, '')
        .replace(/URL:\s*.+/, '')
        .replace(/Link:\s*.+/, '')
        .trim();

      return compactSource({ title, url, content });
    })
    .filter((item) => item.title || item.url || item.content)
    .slice(0, 5);
}

function extractSources(message: any): KivoWebSource[] | undefined {
  const executedTools = Array.isArray(message?.executed_tools) ? message.executed_tools : [];

  const sources = executedTools.flatMap((tool: any) => {
    const directResults = tool?.search_results?.results;
    if (Array.isArray(directResults)) {
      return directResults.map((item: any) =>
        compactSource({
          title: item.title,
          url: item.url,
          content: item.content,
          score: item.score,
        }),
      );
    }

    return parseSourcesFromToolOutput(tool?.output);
  });

  const unique = new Map<string, KivoWebSource>();
  for (const source of sources) {
    const key = source.url || source.title || source.content;
    if (key && !unique.has(key)) unique.set(key, source);
  }

  const compact = Array.from(unique.values()).slice(0, 5);
  return compact.length ? compact : undefined;
}

export async function runGroq(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const model = input.forceModel ?? 'groq:fast';
  const isCompound = model === 'groq:compound';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), isCompound ? 30_000 : 25_000);

  const body: any = {
    model: KIVO_MODEL_NAMES[model],
    messages: input.messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? (isCompound ? 650 : 900),
  };

  if (isCompound) {
    body.compound_custom = {
      tools: {
        enabled_tools: ['web_search'],
      },
    };

    if (input.webSearch) {
      const searchSettings = removeEmptyValues({
        country: input.webSearch.country,
        include_domains: input.webSearch.includeDomains,
        exclude_domains: input.webSearch.excludeDomains,
      });

      if (Object.keys(searchSettings).length > 0) body.search_settings = searchSettings;
    }
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(isCompound ? { 'Groq-Model-Version': '2025-07-23' } : {}),
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
    const content = message?.content ?? '';

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return {
      model,
      provider: 'groq',
      content,
      sources: extractSources(message),
      raw: isCompound ? { usedCompound: true, toolCount: Array.isArray(message?.executed_tools) ? message.executed_tools.length : 0 } : undefined,
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
