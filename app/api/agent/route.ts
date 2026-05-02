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

function getTypingDelay(token: string, index: number) {
  const trimmed = token.trim();
  const randomJitter = Math.floor(Math.random() * 10);

  if (!trimmed) return 8;
  if (token.includes('\n\n')) return 190 + randomJitter;
  if (token.includes('\n')) return 120 + randomJitter;
  if (/[.!?]$/.test(trimmed)) return 95 + randomJitter;
  if (/[,;:]$/.test(trimmed)) return 48 + randomJitter;
  if (index > 0 && index % 18 === 0) return 55 + randomJitter;

  return 12 + randomJitter;
}

function isLikelyCurrentInfoRequest(message: string) {
  const text = message.toLowerCase();
  return [
    'today', 'latest', 'current', 'recent', 'news', 'price', 'prices', 'cheapest', 'available', 'now', 'web', 'search',
    'etsi', 'hae', 'uusin', 'uusi', 'uutinen', 'uutiset', 'ajankohtainen', 'tänään', 'halvin', 'hinta', 'saatavilla', 'verkosta',
  ].some((keyword) => text.includes(keyword));
}

function buildSearchUrl(message: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(message)}`;
}

function createInitialSteps(message: string): StreamStep[] {
  const needsCurrentInfo = isLikelyCurrentInfoRequest(message);

  if (needsCurrentInfo) {
    return [
      { id: 'understand-request', title: 'Understanding the request', detail: 'Detecting what information is needed', status: 'running', kind: 'think' },
      { id: 'prepare-search', title: 'Preparing web search', detail: 'Choosing the safest way to look for current information', status: 'pending', kind: 'plan' },
      { id: 'open-browser', title: 'Opening browser', detail: 'Loading a safe search page', status: 'pending', kind: 'browser' },
      { id: 'search-web', title: 'Searching the web', detail: 'Looking for relevant and current sources', status: 'pending', kind: 'search' },
      { id: 'read-results', title: 'Reading results', detail: 'Extracting useful details from the best matches', status: 'pending', kind: 'read' },
      { id: 'build-answer', title: 'Building the answer', detail: 'Turning the findings into a clear response', status: 'pending', kind: 'write' },
    ];
  }

  return [
    { id: 'understand-request', title: 'Understanding the request', detail: 'Reading your message and choosing the right approach', status: 'running', kind: 'think' },
    { id: 'plan-response', title: 'Planning the response', detail: 'Structuring the answer before writing', status: 'pending', kind: 'plan' },
    { id: 'build-answer', title: 'Building the answer', detail: 'Preparing the final response', status: 'pending', kind: 'write' },
  ];
}

function normalizeAgentStep(rawStep: any, index: number): StreamStep {
  const title = rawStep?.title ?? rawStep?.label ?? `Step ${index + 1}`;
  const id = rawStep?.id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ?? `step-${index}`;
  const rawKind = rawStep?.kind ?? 'think';
  const kind: StreamStep['kind'] = ['think', 'plan', 'search', 'browser', 'read', 'tool', 'write', 'done'].includes(rawKind) ? rawKind : 'tool';

  return { id, title, detail: rawStep?.detail, status: 'pending', kind };
}

// 🔥 FIXED: always use request origin (works in Vercel + local)
async function fetchBrowserPreview(url: string, origin: string) {
  try {
    const res = await fetch(`${origin}/api/browser/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function runStepSequence(send: (event: string, data: unknown) => void, steps: StreamStep[], message: string, origin: string) {
  const needsBrowser = isLikelyCurrentInfoRequest(message);
  const searchUrl = buildSearchUrl(message);
  let browserPreviewStarted = false;

  for (let index = 0; index < steps.length; index += 1) {
    const current = steps[index];

    send('step', { ...current, status: 'running' });

    if (needsBrowser && current.id === 'open-browser' && !browserPreviewStarted) {
      browserPreviewStarted = true;
      send('browser', {
        url: searchUrl,
        action: 'open',
        actionLabel: 'Opening search page',
        status: 'running',
        cursor: { x: 18, y: 22 },
      });

      const preview = await fetchBrowserPreview(searchUrl, origin);
      if (preview?.screenshotUrl) {
        send('browser', {
          url: preview.url,
          title: preview.title,
          screenshotUrl: preview.screenshotUrl,
          action: 'read',
          actionLabel: 'Reading search results',
          status: 'running',
          highlight: { x: 8, y: 20, width: 84, height: 34 },
          cursor: { x: 54, y: 38 },
        });
      }
    }

    if (needsBrowser && current.id === 'search-web') {
      send('browser', {
        url: searchUrl,
        action: 'search',
        actionLabel: 'Scanning relevant results',
        status: 'running',
        highlight: { x: 7, y: 24, width: 86, height: 20 },
        cursor: { x: 82, y: 32 },
      });
    }

    if (needsBrowser && current.id === 'read-results') {
      send('browser', {
        url: searchUrl,
        action: 'scroll',
        actionLabel: 'Scrolling through results',
        status: 'running',
        highlight: { x: 8, y: 42, width: 84, height: 28 },
        cursor: { x: 74, y: 58 },
      });
    }

    await delay(index === 0 ? 180 : 320);
    send('step', { ...current, status: 'done' });
    await delay(110);

    const next = steps[index + 1];
    if (next) send('step', { ...next, status: 'running' });
  }

  if (needsBrowser) {
    send('browser', { url: searchUrl, action: 'done', actionLabel: 'Browser task complete', status: 'done' });
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

    const origin = new URL(req.url).origin;

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

          await runStepSequence(send, stepsToRun, message, origin);

          send('meta', { model: result.model, provider: result.provider });
          if (result.structuredData) send('data', { structuredData: result.structuredData });

          await delay(260);

          const tokens = result.answer.match(/\S+\s*/g) ?? [];
          for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];
            send('token', { token });
            await delay(getTypingDelay(token, index));
          }

          await delay(140);
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
