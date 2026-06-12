import { callDeepSeek } from '@/lib/deepseek';
import { SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { retrieveTopK } from '@/lib/retrieval';

export async function POST(request) {
  try {
    const { message, chatHistory, chunks } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Group and number feedback sources chronologically based on sourceId
    const feedbackSources = Array.from(
      new Set(
        (chunks || [])
          .filter((c) => c.sourceType === 'feedback')
          .map((c) => c.sourceId)
      )
    );
    // In Firestore, sourceId prefix is src_Timestamp, so alphabetical sort matches creation order
    feedbackSources.sort((a, b) => a.localeCompare(b));

    const feedbackNumberMap = {};
    feedbackSources.forEach((id, index) => {
      feedbackNumberMap[id] = index + 1;
    });

    // Enrich chunks to prefix sourceName with "Feedback X: " so they match queries for "Feedback X"
    const enrichedChunks = (chunks || []).map((c) => {
      if (c.sourceType === 'feedback') {
        const num = feedbackNumberMap[c.sourceId];
        return {
          ...c,
          sourceName: `Feedback ${num}: ${c.sourceName || ''}`,
        };
      }
      return c;
    });

    // Retrieve relevant chunks via BM25 using enriched chunks
    const relevantChunks = retrieveTopK(message, enrichedChunks, 8);

    // Build context from retrieved chunks
    let contextBlock = '';
    if (relevantChunks.length) {
      contextBlock = relevantChunks
        .map(
          (c) =>
            `[Source: ${c.sourceName} | Type: ${c.sourceType} | ID: ${c.chunkId}]\n${c.text}`
        )
        .join('\n\n---\n\n');
    } else if (chunks && chunks.length > 0) {
      // Documents exist but no direct text matches (e.g. general greeting or query mismatch)
      // Provide the list of uploaded files so the assistant is aware they are available
      const uniqueSources = Array.from(
        new Set(
          enrichedChunks.map((c) =>
            c.sourceType === 'feedback'
              ? c.sourceName
              : `${c.sourceType.replace('_', ' ')}: ${c.sourceName}`
          )
        )
      );
      contextBlock = `The student has uploaded the following documents for this module:\n${uniqueSources
        .map((name) => `- ${name}`)
        .join('\n')}\n\nNote: The student's current message did not yield any direct keyword matches from these documents. Please answer their message, and if they refer to one of the files above, invite them to be more specific or ask you directly about details from them.`;
    } else {
      contextBlock = 'No source documents have been uploaded yet. Please ask the student to upload their feedback, mark schemes, and learning outcomes.';
    }

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
