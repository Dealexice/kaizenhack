import { callDeepSeek } from '@/lib/deepseek';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { retrieveTopK } from '@/lib/retrieval';

export async function POST(request) {
  try {
    const { message, chatHistory, chunks } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Retrieve relevant chunks via BM25
    const relevantChunks = retrieveTopK(message, chunks || [], 8);

    // Build context from retrieved chunks
    const contextBlock = relevantChunks.length
      ? relevantChunks
          .map(
            (c) =>
              `[Source: ${c.sourceName} | Type: ${c.sourceType} | ID: ${c.chunkId}]\n${c.text}`
          )
          .join('\n\n---\n\n')
      : 'No source documents have been uploaded yet. Please ask the student to upload their feedback, mark schemes, and learning outcomes.';

    // Build messages array
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `## Source Excerpts (cite using [[chunk_id]] format)\n\n${contextBlock}`,
      },
    ];

    // Add chat history (last 10 messages to stay within context)
    if (chatHistory && chatHistory.length) {
      const recent = chatHistory.slice(-10);
      for (const msg of recent) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    const reply = await callDeepSeek(messages, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    return Response.json({
      reply,
      citedChunks: relevantChunks.map((c) => ({
        chunkId: c.chunkId,
        text: c.text,
        sourceName: c.sourceName,
        sourceType: c.sourceType,
        sourceId: c.sourceId,
      })),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
