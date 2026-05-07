import { NextResponse } from 'next/server';
import { runKivoAgent } from '@/lib/agent/run-agent';
import type { KivoAgentId, KivoContextId, KivoModeId } from '@/lib/ai/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AgentAttachment = {
  id?: string;
  name?: string;
  type?: string;
  mimeType?: string;
  url?: string;
  size?: number;
  metadata?: Record<string, unknown>;
};

type AgentRequest = {
  message?: string;
  agent?: KivoAgentId;
  mode?: KivoModeId;
  context?: KivoContextId;
  userId?: string;
  conversationId?: string;
  timezone?: string;
  locale?: string;
  attachments?: AgentAttachment[];
  metadata?: Record<string, unknown>;
};

function encoderLine(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getImageAttachments(attachments?: AgentAttachment[]) {
  return (attachments ?? [])
    .filter((attachment) => {
      const mimeType = attachment.mimeType || attachment.type || '';
      const url = attachment.url || '';

      return Boolean(url) && (
        mimeType.startsWith('image/') ||
        attachment.type === 'image' ||
        url.startsWith('data:image/')
      );
    })
    .slice(0, 6);
}

function getTypingDelay(token: string, index: number) {
  const trimmed = token.trim();
  const randomJitter = Math.floor(Math.random() * 8);

  if (!trimmed) return 4;
  if (token.includes('\n\n')) return 90 + randomJitter;
  if (token.includes('\n')) return 55 + randomJitter;
  if (/[.!?]$/.test(trimmed)) return 34 + randomJitter;
  if (/[,;:]$/.test(trimmed)) return 18 + randomJitter;
  if (index > 0 && index % 24 === 0) return 18 + randomJitter;

  return 5 + randomJitter;
}

function streamHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const imageAttachments = getImageAttachments(body.attachments);
    const message = body.message?.trim() || (imageAttachments.length ? 'Analyze the attached image.' : '');
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
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(encoderLine(event, data)));
        };

        try {
          const result = await runKivoAgent({
            message,
            agent,
            mode,
            context,
            userId,
            conversationId: body.conversationId,
            timezone: body.timezone,
            locale: body.locale,
            attachments: imageAttachments,
            metadata: body.metadata,
          });

          send('meta', {
            model: result.model,
            provider: result.provider,
          });

          if (result.structuredData) {
            send('data', {
              structuredData: result.structuredData,
            });
          }

          const tokens = result.answer.match(/\S+\s*/g) ?? [];

          for (let index = 0; index < tokens.length; index += 1) {
            const token = tokens[index];
            send('token', { token });
            await delay(getTypingDelay(token, index));
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
      headers: streamHeaders(),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
