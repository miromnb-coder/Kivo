import { runKivoModel } from '@/lib/ai/model-router';

type MemoryCandidate = {
  type: 'preference' | 'goal' | 'fact' | 'person' | 'project' | 'routine' | 'constraint';
  content: string;
  importance: 1 | 2 | 3 | 4 | 5;
};

function safeJsonParse(text: string): MemoryCandidate[] {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.content === 'string' && typeof item.type === 'string')
      .map((item) => ({
        type: item.type,
        content: item.content.trim(),
        importance: Math.min(5, Math.max(1, Number(item.importance) || 3)),
      }))
      .filter((item) => item.content.length > 8 && item.content.length < 240);
  } catch {
    return [];
  }
}

export async function extractMemoryCandidates(message: string, answer: string): Promise<MemoryCandidate[]> {
  const result = await runKivoModel({
    agent: 'kivo',
    mode: 'ask',
    context: 'general',
    complexity: 'low',
    temperature: 0.1,
    maxTokens: 450,
    messages: [
      {
        role: 'system',
        content: [
          'Extract only useful long-term memories for a personal AI assistant.',
          'Return strict JSON array only. No markdown.',
          'Allowed type values: preference, goal, fact, person, project, routine, constraint.',
          'Only save stable information that will still matter later.',
          'Do not save temporary requests, greetings, or generic chat.',
          'Do not save sensitive secrets, passwords, API keys, or payment details.',
          'Format: [{"type":"preference","content":"User prefers short Finnish answers","importance":4}]',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `User message:\n${message}\n\nAssistant answer:\n${answer}`,
      },
    ],
  });

  return safeJsonParse(result.content);
}
