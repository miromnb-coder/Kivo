import { NextResponse } from 'next/server';
import { runKivoModel } from '@/lib/ai/model-router';
import type { KivoAgentId, KivoContextId, KivoModeId, KivoModelMessage } from '@/lib/ai/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AgentRequest = {
  message?: string;
  agent?: KivoAgentId;
  mode?: KivoModeId;
  context?: KivoContextId;
  history?: KivoModelMessage[];
};

function encoderLine(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const agent = body.agent ?? 'kivo';
    const mode = body.mode ?? 'chat';
    const context = body.context ?? 'general';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(encoderLine(event, data)));

        try {
          send('step', { label: 'Understanding request', status: 'done' });
          send('step', { label: `Using ${agent} agent`, status: 'done' });
          send('step', { label: mode === 'deep' ? 'Preparing deeper reasoning' : 'Preparing response', status: 'active' });

          const messages: KivoModelMessage[] = [
            {
              role: 'system',
              content: `You are Kivo, a personal AI agent. Agent: ${agent}. Mode: ${mode}. Context: ${context}. Be useful, concise, and personal.`,
            },
            ...(body.history ?? []).slice(-8),
            { role: 'user', content: message },
          ];

          const result = await runKivoModel({
            agent,
            mode,
            context,
            messages,
            complexity: mode === 'deep' ? 'high' : 'low',
          });

          send('meta', { model: result.model, provider: result.provider });

          const tokens = result.content.match(/\S+\s*/g) ?? [];
          for (const token of tokens) {
            send('token', { token });
            await new Promise((resolve) => setTimeout(resolve, 8));
          }

          send('done', { content: result.content, model: result.model, provider: result.provider });
          controller.close();
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Agent failed' });
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
