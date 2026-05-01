import { runKivoModel } from '@/lib/ai/model-router';
import { createPlan } from './planner';
import { getMemoryContext } from './memory';
import { buildProactiveSuggestions, buildProactivePrompt } from './proactive';
import {
  runCalendarTodayTool,
  shouldRunCalendarTodayTool,
} from './tools/calendar';
import { runGmailTool, shouldRunGmailTool } from './tools/gmail';
import { routeIntent } from './router';
import type { AgentRequest, AgentResult } from './types';

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);

  const calendar = await runCalendarTodayTool(req.userId);
  const gmail = await runGmailTool(req.userId);

  // 🔥 Gmail intelligence
  if (shouldRunGmailTool(req.message)) {
    if (!gmail.connected) {
      return { answer: 'Gmail ei ole yhdistetty.', steps: [], intent };
    }

    if (gmail.error) {
      return { answer: `Gmail virhe: ${gmail.error}`, steps: [], intent };
    }

    if (gmail.bills.length > 0) {
      return {
        answer: `Sinulla on ${gmail.bills.length} laskuun liittyvää sähköpostia:\n${gmail.bills
          .map((m) => `• ${m.subject}`)
          .join('\n')}`,
        steps: [],
        intent,
      };
    }

    if (gmail.important.length > 0) {
      return {
        answer: `Tärkeät sähköpostit:\n${gmail.important.map((m) => `• ${m.subject}`).join('\n')}`,
        steps: [],
        intent,
      };
    }

    return {
      answer: gmail.messages.map((m) => `• ${m.subject}`).join('\n') || 'Ei sähköposteja.',
      steps: [],
      intent,
    };
  }

  // 🔥 Combined intelligence
  if (calendar.connected && gmail.connected) {
    if (calendar.events.length === 0 && gmail.bills.length > 0) {
      return {
        answer: `Sinulla ei ole tapahtumia tänään, mutta sinulla on ${gmail.bills.length} laskuun liittyvää sähköpostia. Haluatko että muistutan sinua?`,
        steps: [],
        intent,
      };
    }
  }

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      {
        role: 'system',
        content: 'You are Kivo AI. Be proactive and smart.',
      },
      { role: 'user', content: req.message },
    ],
  });

  return {
    answer: response.content,
    steps: plan.steps.map((s) => ({ ...s, status: 'done' })),
    intent,
  };
}
