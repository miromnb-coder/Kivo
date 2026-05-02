import { NextResponse } from 'next/server';
import { runKivoAgent } from '@/lib/agent/run-agent';
import type { KivoAgentId, KivoContextId, KivoModeId } from '@/lib/ai/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AgentRequest = {
  message?: string;
  agent?: KivoAgentId;
  mode?: KivoModeId;
  context?: KivoContextId;
  userId?: string;
};

type StreamStep = {
  id: string;
  title: string;
  detail?: string;
  status: 'pending' | 'running' | 'done';
  kind: 'think' | 'plan' | 'search' | 'browser' | 'read' | 'tool' | 'write' | 'done';
};

function encoderLine(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLikelyCurrentInfoRequest(message: string) {
  const text = message.toLowerCase();
  return [
    'today',
    'latest',
    'current',
    'recent',
    'news',
    'price',
    'prices',
    'cheapest',
    'available',
    'now',
    'web',
    'search',
    'etsi',
    'hae',
    'uusin',
    'uusi',
    'uutinen',
    'uutiset',
    'ajankohtainen',
    'tänään',
    'halvin',
    'hinta',
    'saatavilla',
    'verkosta',
  ].some((keyword) => text.includes(keyword));
}

function createInitialSteps(message: string): StreamStep[] {
  const needsCurrentInfo = isLikelyCurrentInfoRequest(message);

  if (needsCurrentInfo) {
    return [
      {
        id: 'understand-request',
        title: 'Understanding the request',
        detail: 'Detecting what information is needed',
        status: 'running',
        kind: 'think',
      },
      {
        id: 'prepare-search',
        title: 'Preparing web search',
        detail: 'Choosing the safest way to look for current information',
        status: 'pending',
        kind: 'plan',
      },
      {
        id: 'search-web',
        title: 'Searching the web',
        detail: 'Looking for relevant and current sources',
        status: 'pending',
        kind: 'search',
      },
      {
        id: 'read-results',
        title: 'Reading results',
        detail: 'Extracting useful details from the best matches',
        status: 'pending',
        kind: 'read',
      },
      {
        id: 'build-answer',
        title: 'Building the answer',
        detail: 'Turning the findings into a clear response',
        status: 'pending',
        kind: 'write',
      },
    ];
  }

  return [
    {
      id: 'understand-request',
      title: 'Understanding the request',
      detail: 'Reading your message and choosing the right approach',
      status: 'running',
      kind: 'think',
    },
    {
      id: 'plan-response',
      title: 'Planning the response',
      detail: 'Structuring the answer before writing',
      status: 'pending',
      kind: 'plan',
    },
    {
      id: 'build-answer',
      title: 'Building the answer',
      detail: 'Preparing the final response',
      status: 'pending',
      kind: 'write',
    },
  ];
}

function normalizeAgentStep(rawStep: any, index: number): StreamStep {
  const title = rawStep?.title ?? rawStep?.label ?? `Step ${index + 1}`;
  const id = rawStep?.id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ?? `step-${index}`;
  const rawKind = rawStep?.kind ?? 'think';
  const kind: StreamStep['kind'] = ['think', 'plan', 'search', 'browser', 'read', 'tool', 'write', 'done'].includes(rawKind) ? rawKind : 'tool';

  return {
    id,
    title,
    detail: rawStep?.detail,
    status: 'pending',
    kind,
  };
}

async function runStepSequence(send: (event: string, data: unknown) => void, steps: StreamStep[]) {
  for (let index = 0; index < steps.length; index += 1) {
    const current = steps[index];

    send('step', { ...current, status: 'running' });
    await delay(index === 0 ? 180 : 320);
    send('step', { ...current, status: 'done' });
    await delay(110);

    const next = steps[index + 1];
    if (next) send('step', { ...next, status: 'running' });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const message = body.message?.trim();
    const userId = body.userId?.trim();

    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agent = body.agent ?? 'kivo';
    const mode = body.mode ?? 'chat';
    const context = body.context ?? 'general';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(encoderLine(event, data)));

        try {
          const initialSteps = createInitialSteps(message);
          for (const step of initialSteps) send('step', step);

          const result = await runKivoAgent({ message, agent, mode, context, userId });
          const agentSteps = Array.isArray(result.steps) ? result.steps.map(normalizeAgentStep) : [];
          const stepsToRun = agentSteps.length ? agentSteps : initialSteps;

          await runStepSequence(send, stepsToRun);

          send('meta', { model: result.model, provider: result.provider });

          if (result.structuredData) send('data', { structuredData: result.structuredData });

          const tokens = result.answer.match(/\S+\s*/g) ?? [];
          for (const token of tokens) {
            send('token', { token });
            await delay(10);
          }

          send('done', { content: result.answer, model: result.model, provider: result.provider, structuredData: result.structuredData });
          controller.close();
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Agent failed' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
