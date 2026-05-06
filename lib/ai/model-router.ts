import { runGroq } from './providers/groq';
import { runOpenAI } from './providers/openai';
import type { KivoModelId, KivoModelInput, KivoModelResult } from './models';

function hasImages(input: KivoModelInput) {
  return Boolean(input.images?.some((image) => image.url || image.base64));
}

function wantsCurrentInfo(input: KivoModelInput) {
  return Boolean(input.webSearch);
}

export function selectModel(input: KivoModelInput): KivoModelId {
  if (input.forceModel) return input.forceModel;

  if (hasImages(input)) return 'groq:vision';

  if (wantsCurrentInfo(input)) {
    return input.mode === 'deep' || input.complexity === 'high'
      ? 'groq:deep-search'
      : 'groq:search';
  }

  if (input.mode === 'deep') return 'groq:smart';
  if (input.agent === 'planner' || input.agent === 'researcher') return 'groq:smart';
  if (input.agent === 'finance' || input.agent === 'personal') return 'groq:smart';
  if (input.complexity === 'high' || input.complexity === 'medium') return 'groq:smart';

  return 'groq:fast';
}

export async function runKivoModel(input: KivoModelInput): Promise<KivoModelResult> {
  const model = selectModel(input);

  if (
    model === 'groq:fast' ||
    model === 'groq:smart' ||
    model === 'groq:search' ||
    model === 'groq:deep-search' ||
    model === 'groq:vision' ||
    model === 'groq:compound'
  ) {
    return runGroq({ ...input, forceModel: model });
  }

  if (model === 'openai:gpt-5.4-mini') return runOpenAI(input);

  throw new Error(`Unknown model: ${model}`);
}
