import { runKivoModel } from '@/lib/ai/model-router';

type MemoryType =
  | 'preference'
  | 'goal'
  | 'fact'
  | 'person'
  | 'project'
  | 'routine'
  | 'constraint';

type MemoryImportance = 1 | 2 | 3 | 4 | 5;

type MemoryCandidate = {
  type: MemoryType;
  content: string;
  importance: MemoryImportance;
};

const ALLOWED_TYPES: MemoryType[] = [
  'preference',
  'goal',
  'fact',
  'person',
  'project',
  'routine',
  'constraint',
];

const MIN_MEMORY_LENGTH = 12;
const MAX_MEMORY_LENGTH = 260;
const MAX_CANDIDATES = 6;

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeText(value: unknown) {
  return toText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeType(value: unknown): MemoryType {
  const raw = toText(value).toLowerCase();
  return ALLOWED_TYPES.includes(raw as MemoryType) ? (raw as MemoryType) : 'fact';
}

function normalizeImportance(value: unknown): MemoryImportance {
  const n = Math.round(Number(value) || 3);

  if (n <= 1) return 1;
  if (n === 2) return 2;
  if (n === 4) return 4;
  if (n >= 5) return 5;

  return 3;
}

function stripCodeFence(text: string) {
  return text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractJsonArray(text: string) {
  const clean = stripCodeFence(text);
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');

  if (start === -1 || end === -1 || end <= start) return clean;

  return clean.slice(start, end + 1);
}

function containsSensitiveData(content: string) {
  const text = normalizeText(content);

  const sensitiveSignals = [
    'password',
    'passcode',
    'api key',
    'secret key',
    'client secret',
    'private key',
    'access token',
    'refresh token',
    'credit card',
    'card number',
    'bank account',
    'social security',
    'verification code',
    'one time code',
  ];

  return sensitiveSignals.some((signal) => text.includes(signal));
}

function isTemporaryOrLowValue(content: string) {
  const text = normalizeText(content);

  if (!text || text.length < MIN_MEMORY_LENGTH) return true;

  const lowValueSignals = [
    'hello',
    'thanks',
    'thank you',
    'ok',
    'okay',
    'continue',
    'do this',
    'fix this',
    'what does this mean',
    'next',
    'now',
    'today only',
    'temporary',
  ];

  return lowValueSignals.some((signal) => text === signal || text.startsWith(`${signal} `));
}

function isLikelyGenericWorldKnowledge(content: string, type: MemoryType) {
  if (type !== 'fact') return false;

  const text = ` ${normalizeText(content)} `;

  const genericDefinitionSignals = [
    ' is a ',
    ' is an ',
    ' are a ',
    ' means ',
    ' refers to ',
    ' is defined as ',
    ' can be defined as ',
    ' is the process of ',
    ' is a type of ',
  ];

  const hasPersonalSignal = [
    'user ',
    ' the user ',
    'prefers',
    'likes',
    'wants',
    'needs',
    'uses',
    'has ',
    'building',
    'working on',
    'project',
    'goal',
    'routine',
    'account',
    'integration',
    'app',
  ].some((signal) => text.includes(signal));

  return genericDefinitionSignals.some((signal) => text.includes(signal)) && !hasPersonalSignal;
}

function cleanMemoryContent(content: string) {
  return content
    .replace(/\s+/g, ' ')
    .replace(/^[-*•]\s*/, '')
    .trim()
    .slice(0, MAX_MEMORY_LENGTH);
}

function looksSimilar(a: string, b: string) {
  const aNorm = normalizeText(a);
  const bNorm = normalizeText(b);

  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

  const aWords = new Set(aNorm.split(' ').filter((word) => word.length > 2));
  const bWords = bNorm.split(' ').filter((word) => word.length > 2);

  if (!aWords.size || !bWords.length) return false;

  const overlap = bWords.filter((word) => aWords.has(word)).length;
  return overlap / Math.max(aWords.size, bWords.length) >= 0.72;
}

function dedupeCandidates(candidates: MemoryCandidate[]) {
  const output: MemoryCandidate[] = [];

  for (const candidate of candidates) {
    const duplicate = output.find(
      (existing) =>
        existing.type === candidate.type &&
        looksSimilar(existing.content, candidate.content),
    );

    if (!duplicate) {
      output.push(candidate);
      continue;
    }

    duplicate.importance = Math.max(duplicate.importance, candidate.importance) as MemoryImportance;

    if (candidate.content.length > duplicate.content.length) {
      duplicate.content = candidate.content;
    }
  }

  return output;
}

function validateCandidate(item: unknown): MemoryCandidate | null {
  if (!item || typeof item !== 'object') return null;

  const raw = item as Record<string, unknown>;
  const type = normalizeType(raw.type);
  const content = cleanMemoryContent(raw.content);
  const importance = normalizeImportance(raw.importance);

  if (content.length < MIN_MEMORY_LENGTH) return null;
  if (content.length > MAX_MEMORY_LENGTH) return null;
  if (containsSensitiveData(content)) return null;
  if (isTemporaryOrLowValue(content)) return null;
  if (isLikelyGenericWorldKnowledge(content, type)) return null;

  return {
    type,
    content,
    importance,
  };
}

function safeJsonParse(text: string): MemoryCandidate[] {
  try {
    const parsed = JSON.parse(extractJsonArray(text));
    if (!Array.isArray(parsed)) return [];

    const candidates = parsed
      .map(validateCandidate)
      .filter((candidate): candidate is MemoryCandidate => Boolean(candidate));

    return dedupeCandidates(candidates).slice(0, MAX_CANDIDATES);
  } catch {
    return [];
  }
}

function shouldSkipExtraction(message: string, answer: string) {
  const combined = normalizeText(`${message} ${answer}`);

  if (!combined || combined.length < 20) return true;

  const lowValueExact = ['hi', 'hello', 'ok', 'thanks', 'thank you'];
  if (lowValueExact.includes(combined)) return true;

  return false;
}

export async function extractMemoryCandidates(
  message: string,
  answer: string,
): Promise<MemoryCandidate[]> {
  const userMessage = toText(message);
  const assistantAnswer = toText(answer);

  if (shouldSkipExtraction(userMessage, assistantAnswer)) {
    return [];
  }

  const result = await runKivoModel({
    agent: 'kivo',
    mode: 'ask',
    context: 'general',
    complexity: 'low',
    temperature: 0.1,
    maxTokens: 500,
    messages: [
      {
        role: 'system',
        content: [
          'You extract long-term memory candidates for a personal AI assistant.',
          'Return a strict JSON array only. No markdown. No explanation.',
          '',
          'Allowed type values:',
          '- preference',
          '- goal',
          '- fact',
          '- person',
          '- project',
          '- routine',
          '- constraint',
          '',
          'Only extract stable information that may matter in future conversations.',
          'Prefer memories about the user, their preferences, active projects, routines, goals, constraints, tools, integrations, and important people.',
          'Do not save generic world knowledge.',
          'Do not save temporary requests, greetings, one-off tasks, or generic chat.',
          'Do not save secrets, passwords, API keys, access tokens, payment details, or private credentials.',
          'Do not infer facts that were not clearly stated.',
          'Write memory content in clear internal English, even if the conversation is in another language.',
          'Each memory must be self-contained and understandable later.',
          '',
          'Importance scale:',
          '1 = low value',
          '2 = mildly useful',
          '3 = useful',
          '4 = important',
          '5 = very important and stable',
          '',
          'JSON shape:',
          '[{"type":"preference","content":"User prefers concise answers.","importance":4}]',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          'User message:',
          userMessage,
          '',
          'Assistant answer:',
          assistantAnswer,
        ].join('\n'),
      },
    ],
  });

  return safeJsonParse(result.content);
}
