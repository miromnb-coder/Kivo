import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { getMemoryContext, saveAgentRun, saveMemory } from './memory';
import { extractMemoryCandidates } from './memory-extraction';
import { buildMemoryBrief, shouldUseMemory } from './memory-policy';
import { buildProactiveSuggestions, buildProactivePrompt } from './proactive';
import {
  formatCalendarTodayForPrompt,
  runCalendarTodayTool,
  shouldRunCalendarTodayTool,
} from './tools/calendar';
import { runGmailTool, shouldRunGmailTool } from './tools/gmail';
import { routeIntent } from './router';
import { verifyAnswer } from './verifier';
import type { AgentRequest, AgentResult } from './types';

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const memory = await getMemoryContext(req.userId, req.message);
  const plan = createPlan(intent, req.message);

  const calendarResult = await runCalendarTodayTool(req.userId);
  const gmailResult = await runGmailTool(req.userId);

  if (shouldRunGmailTool(req.message)) {
    if (!gmailResult.connected) {
      return { answer: 'Gmail ei ole yhdistetty.', steps: [], intent };
    }

    if (gmailResult.error) {
      return { answer: `Gmail virhe: ${gmailResult.error}`, steps: [], intent };
    }

    const text = gmailResult.messages
      .map((m) => `• ${m.subject} (${m.from})`)
      .join('\n');

    return {
      answer: text || 'Ei sähköposteja.',
      steps: [],
      intent,
    };
  }

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      {
        role: 'system',
        content: `You are Kivo AI.`,
      },
      { role: 'user', content: req.message },
    ],
  });

  return {
    answer: verifyAnswer(response.content),
    steps: plan.steps.map((s) => ({ ...s, status: 'done' })),
    intent,
  };
}
