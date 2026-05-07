import {
  KIVO_MODEL_NAMES,
  type KivoModelImage,
  type KivoModelInput,
  type KivoModelMessage,
  type KivoModelResult,
  type KivoWebSource,
} from '../models';

function removeEmptyValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
  ) as Partial<T>;
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

function isCompoundModel(model: string) {
  return model === 'groq:compound' || model === 'groq:search' || model === 'groq:deep-search';
}

function isVisionModel(model: string) {
  return model === 'groq:vision';
}

function defaultMaxTokens(model: string) {
  if (model === 'groq:search') return 650;
  if (model === 'groq:deep-search') return 1100;
  if (model === 'groq:vision') return 900;
  if (model === 'groq:smart') return 1200;
  return 900;
}

function timeoutMs(model: string) {
  if (model === 'groq:deep-search') return 45_000;
  if (model === 'groq:search' || model === 'groq:compound') return 30_000;
  if (model === 'groq:vision') return 35_000;
  return 25_000;
}

function imageToContentPart(image: KivoModelImage) {
  const url = image.url || (image.base64 ? `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}` : '');

  if (!url) return null;

  return {
    type: 'image_url',
    image_url: {
      url,
    },
  };
}

function buildVisionMessages(messages: KivoModelMessage[], images: KivoModelImage[]) {
  const validImageParts = images.map(imageToContentPart).filter(Boolean);

  if (!validImageParts.length) return messages;

  const lastUserIndex = [...messages]
    .reverse()
    .findIndex((message) => message.role === 'user');

  const actualLastUserIndex = lastUserIndex === -1 ? -1 : messages.length - 1 - lastUserIndex;

  if (actualLastUserIndex === -1) {
    return [
      ...messages,
      {
        role: 'user' as const,
        content: [
          { type: 'text', text: 'Analyze the attached image.' },
          ...validImageParts,
        ],
      },
    ];
  }

  return messages.map((message, index) => {
    if (index !== actualLastUserIndex) return message;

    return {
      role: message.role,
      content: [
        { type: 'text', text: message.content },
        ...validImageParts,
      ],
    };
  });
}

async function fetchGroqChatCompletion(options: {
  apiKey: string;
  body: Record<string, unknown>;
  isCompound: boolean;
  signal: AbortSignal;
}) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
      ...(options.isCompound ? { 'Groq-Model-Version': '2025-07-23' } : {}),
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error?.message || data?.message || `Groq request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export async function runGroq(input: KivoModelInput): Promise<KivoModelResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY');

  const model = input.forceModel ?? 'groq:fast';
  const isCompound = isCompoundModel(model);
  const isVision = isVisionModel(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs(model));

  const body: any = {
    model: KIVO_MODEL_NAMES[model],
    messages: isVision ? buildVisionMessages(input.messages, input.images ?? []) : input.messages,
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? defaultMaxTokens(model),
  };

  if (isCompound) {
    body.tool_choice = 'auto';
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
    const data = await fetchGroqChatCompletion({
      apiKey,
      body,
      isCompound,
      signal: controller.signal,
    });

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
      raw: isCompound
        ? {
            usedCompound: true,
            compoundModel: KIVO_MODEL_NAMES[model],
            toolCount: Array.isArray(message?.executed_tools) ? message.executed_tools.length : 0,
          }
        : isVision
          ? { usedVision: true, imageCount: input.images?.length ?? 0 }
          : undefined,
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
