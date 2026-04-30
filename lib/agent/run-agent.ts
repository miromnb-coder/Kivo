import { routeIntent } from './router';
import { createPlan } from './planner';
import { getMemoryContext } from './memory';
import { verifyAnswer } from './verifier';
import { callModel } from '@/lib/ai/call-model';
import type { AgentRequest, AgentResult } from './types';

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);

  const memory = await getMemoryContext(req.userId);

  const plan = createPlan(intent, req.message);

  const response = await callModel({
    message: `${memory.profileSummary}\n\nUser: ${req.message}`,
    agent: req.agent,
    mode: req.mode,
    context: req.context,
  });

  const final = verifyAnswer(response.text);

  return {
    answer: final,
    steps: plan.steps.map((s, i) => ({ ...s, status: i === plan.steps.length - 1 ? 'done' : 'done' })),
    intent,
    model: response.model,
    provider: response.provider,
  };
}
