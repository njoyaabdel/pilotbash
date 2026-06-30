import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '@/services/agent/AgentService';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Content-Type guard
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }

  // Body size guard (~50KB)
  const bodyText = await req.text();
  if (bodyText.length > 50_000) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('messages' in body) ||
    !Array.isArray((body as { messages: unknown }).messages)
  ) {
    return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
  }

  const messages = (body as { messages: Array<{ role: string; content: string }> }).messages;

  // Validate message shape
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string') {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }
  }

  try {
    const result = AgentService.stream({
      messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('[/api/chat] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
