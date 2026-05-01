import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { getMemoryContext, saveAgentRun, saveMemory } from './memory';
import { extractMemoryCandidates } from './memory-extraction';
import { buildMemoryBrief, shouldUseMemory } from './memory-policy';
import { buildProactiveSuggestions, buildProactivePrompt } from './proactive';
import {
  formatCalendarTodayForPrompt,
  runCalendarTodayTool,
} from './tools/calendar';
import { routeIntent } from './router';
import { verifyAnswer } from './verifier';
import type { AgentRequest, AgentResult } from './types';

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const memory = await getMemoryContext(req.userId, req.message);
  const plan = createPlan(intent, req.message);

  const useMemory = shouldUseMemory(memory);
  const memoryBrief = useMemory ? buildMemoryBrief(memory, intent) : '';

  const proactiveSuggestions = buildProactiveSuggestions(memory, intent);
  const proactivePrompt = buildProactivePrompt(proactiveSuggestions);

  const calendarResult = await runCalendarTodayTool(req.userId);
  const calendarPrompt = calendarResult
    ? `Use this real calendar data when relevant. Do not invent events. If the user asks about today, schedule, free time, plans, or calendar, answer from this data:\n${formatCalendarTodayForPrompt(calendarResult)}`
    : '';

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    complexity: req.mode === 'deep' || intent === 'plan' || intent === 'research' ? 'high' : 'low',
    messages: [
      {
        role: 'system',
        content: [
          'You are Kivo, a high-end personal AI operator.',
          `Intent: ${intent}.`,
          useMemory ? memoryBrief : 'No memory available. Stay neutral.',
          calendarPrompt,
          proactivePrompt,
          'Be proactive, but not annoying. Always stay relevant.',
        ].filter(Boolean).join('\n\n'),
      },
      { role: 'user', content: req.message },
    ],
  });

  const final = verifyAnswer(response.content);

  if (req.userId) {
    await saveAgentRun(req.userId, req.message, final);

    try {
      const candidates = await extractMemoryCandidates(req.message, final);

      for (const memoryItem of candidates) {
        await saveMemory(req.userId, memoryItem.content, memoryItem.type, memoryItem.importance);
      }
    } catch {}
  }

  return {
    answer: final,
    steps: plan.steps.map((step) => ({ ...step, status: 'done' })),
    intent,
    model: response.model,
    provider: response.provider,
    structuredData: {
      proactiveSuggestions,
      calendar: calendarResult,
    },
  };
}
