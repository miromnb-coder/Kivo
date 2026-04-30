import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { getMemoryContext, saveAgentRun } from './memory';
import { routeIntent } from './router';
import { verifyAnswer } from './verifier';
import type { AgentRequest, AgentResult } from './types';

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const memory = await getMemoryContext(req.userId);
  const plan = createPlan(intent, req.message);

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    complexity: req.mode === 'deep' || intent === 'plan' || intent === 'research' ? 'high' : 'low',
    messages: [
      {
        role: 'system',
        content: [
          'You are Kivo, a personal AI agent.',
          `Intent: ${intent}.`,
          `User: ${memory.profileSummary}.`,
          `Preferences: ${memory.preferences.join(', ')}`,
          'Be helpful and personal.',
        ].join('\n'),
      },
      { role: 'user', content: req.message },
    ],
  });

  const final = verifyAnswer(response.content);

  if (req.userId) {
    await saveAgentRun(req.userId, req.message, final);
  }

  return {
    answer: final,
    steps: plan.steps.map((step) => ({ ...step, status: 'done' })),
    intent,
    model: response.model,
    provider: response.provider,
  };
}
