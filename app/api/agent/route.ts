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

function encoderLine(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const message = body.message?.trim();
    const userId = body.userId?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = body.agent ?? 'kivo';
    const mode = body.mode ?? 'chat';
    const context = body.context ?? 'general';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(encoderLine(event, data)));

        try {
          const agentPromise = runKivoAgent({
            message,
            agent,
            mode,
            context,
            userId,
          });

          send('step', { label: 'Understanding your request', status: 'active' });
          await new Promise((r) => setTimeout(r, 180));

          send('step', { label: 'Checking your context', status: 'active' });
          await new Promise((r) => setTimeout(r, 200));

          const result = await agentPromise;

          for (const step of result.steps) {
            send('step', { ...step, status: 'done' });
            await new Promise((r) => setTimeout(r, 120));
          }

          send('meta', { model: result.model, provider: result.provider });

          if (result.structuredData) {
            send('data', { structuredData: result.structuredData });
          }

          const tokens = result.answer.match(/\S+\s*/g) ?? [];
          for (const token of tokens) {
            send('token', { token });
            await new Promise((r) => setTimeout(r, 10));
          }

          send('done', {
            content: result.answer,
            model: result.model,
            provider: result.provider,
            structuredData: result.structuredData,
          });

          controller.close();
        } catch (error) {
          send('error', {
            message: error instanceof Error ? error.message : 'Agent failed',
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
