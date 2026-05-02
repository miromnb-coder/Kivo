import { runGroq } from './providers/groq';
import { runOpenAI } from './providers/openai';
import type { KivoModelId, KivoModelInput, KivoModelResult } from './models';

export function selectModel(input: KivoModelInput): KivoModelId {
  if (input.forceModel) return input.forceModel;

  if (input.mode === 'deep') return 'openai:gpt-5.4-mini';
  if (input.agent === 'planner' || input.agent === 'researcher') return 'openai:gpt-5.4-mini';
  if (input.complexity === 'high') return 'openai:gpt-5.4-mini';

  return 'groq:fast';
}

export async function runKivoModel(input: KivoModelInput): Promise<KivoModelResult> {
  const model = selectModel(input);

  if (model === 'groq:fast') return runGroq({ ...input, forceModel: 'groq:fast' });
  if (model === 'groq:compound') return runGroq({ ...input, forceModel: 'groq:compound' });

  if (model === 'openai:gpt-5.4-mini') return runOpenAI(input);

  throw new Error(`Unknown model: ${model}`);
}
