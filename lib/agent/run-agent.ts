// PATCHED VERSION (only relevant parts changed)
import { runOutlookTool } from './tools/outlook';

// inside runKivoAgent before Promise.all
const includeOutlook = ['outlook', 'email', 'mail', 'sähköposti'].some((w) => req.message.toLowerCase().includes(w));

// modify Promise.all section
const [calendar, gmail, outlook] = await Promise.all([
  includeCalendar ? runCalendarTodayTool(req.userId) : Promise.resolve({ connected: false, events: [] }),
  includeGmail ? runGmailTool(req.userId) : Promise.resolve({ connected: false, messages: [], important: [], bills: [], lowPriority: [] }),
  includeOutlook ? runOutlookTool(req.userId) : Promise.resolve({ connected: false, messages: [], events: [] }),
]);

// extend tool context
if (includeOutlook && outlook.connected) {
  const outlookLines = [
    `Outlook: ${outlook.messages.length} emails, ${outlook.events.length} events.`,
    ...outlook.messages.map((m: any, i: number) => `- ${i + 1}. ${m.subject} from ${m.from}`),
    ...outlook.events.map((e: any, i: number) => `- Event: ${e.subject} at ${e.start}`),
  ];
  const extraContext = outlookLines.join('\n');
}
