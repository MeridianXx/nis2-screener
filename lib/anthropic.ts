import Anthropic from '@anthropic-ai/sdk';
import {
  EXPLAIN_MAX_TOKENS,
  EXPLAIN_MODEL,
  EXPLAIN_SYSTEM_PROMPT,
  buildExplainUserPrompt,
  type ExplainContext,
} from '@/lib/explain-prompt';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export class MissingAnthropicKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY saknas');
    this.name = 'MissingAnthropicKeyError';
  }
}

export async function generateExplanation(ctx: ExplainContext): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) throw new MissingAnthropicKeyError();

  const message = await anthropic.messages.create({
    model: EXPLAIN_MODEL,
    max_tokens: EXPLAIN_MAX_TOKENS,
    system: EXPLAIN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildExplainUserPrompt(ctx) }],
  });

  const text = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();

  if (!text) throw new Error('Tomt svar från Anthropic');
  return text;
}
