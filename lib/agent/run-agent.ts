// ADD ABOVE runKivoAgent
function shouldCreateDocumentCard(message: string, answer: string) {
  const text = message.toLowerCase();

  const triggers = [
    'suunnittele', 'plan', 'kirjoita', 'write', 'tee minulle', 'create', 'rakenna', 'build', 'roadmap', 'aikataulu', 'päivä'
  ];

  const isLong = answer.length > 700;
  const isStructured = answer.includes('##') || answer.includes('1.') || answer.includes('- ');

  return triggers.some((t) => text.includes(t)) && isLong && isStructured;
}

function buildDocumentCard(answer: string) {
  const lines = answer.split('\n').filter(Boolean);
  const title = lines.find((l) => l.startsWith('##'))?.replace(/^##\s*/, '') || lines[0] || 'Kivo document';

  return {
    title,
    type: 'Markdown',
    content: answer,
  };
}

// MODIFY RETURN PART

export async function runKivoAgent(req: AgentRequest): Promise<AgentResult> {
  const intent = routeIntent(req.message);
  const plan = createPlan(intent, req.message);
  const needsClarification = shouldAskClarifyingQuestion(req.message);

  if (needsClarification) {
    const steps = buildExecutionSteps(req.message, { clarify: true });
    return withStructuredData(
      { answer: buildClarifyingAnswer(req.message), steps, intent },
      { clarification: { required: true, reason: 'Missing important context for a high-quality result.' } }
    );
  }

  await runCalendarTodayTool(req.userId);
  await runGmailTool(req.userId);
  const executionSteps = buildExecutionSteps(req.message, { calendar: false, gmail: shouldRunGmailTool(req.message), today: false });

  const response = await runKivoModel({
    agent: req.agent,
    mode: req.mode,
    context: req.context,
    messages: [
      { role: 'system', content: KIVO_SYSTEM_PROMPT },
      { role: 'user', content: req.message }
    ],
  });

  const createDoc = shouldCreateDocumentCard(req.message, response.content);

  return withStructuredData(
    {
      answer: response.content,
      steps: executionSteps.length ? executionSteps : plan.steps.map((s) => ({ ...s, status: 'done' })),
      intent,
    },
    {
      gmail: null,
      calendar: null,
      documentCard: createDoc ? buildDocumentCard(response.content) : null,
    }
  );
}
