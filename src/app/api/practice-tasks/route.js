import { callDeepSeek } from '@/lib/deepseek';
import { SYSTEM_PROMPT, PRACTICE_TASKS_PROMPT } from '@/lib/systemPrompt';

export async function POST(request) {
  try {
    const { weaknesses, chunks } = await request.json();

    if (!weaknesses || !weaknesses.length) {
      return Response.json(
        { error: 'No weaknesses provided' },
        { status: 400 }
      );
    }

    // Build context from relevant chunks
    const contextBlock = (chunks || [])
      .map((c) => `[ID: ${c.chunkId} | Source: ${c.sourceName}]\n${c.text}`)
      .join('\n\n---\n\n');

    const weaknessBlock = weaknesses
      .map(
        (w) =>
          `- **${w.title}** (${w.learningOutcome}): ${w.description}\n  Suggested: ${w.suggestedAction || 'N/A'}`
      )
      .join('\n');

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${PRACTICE_TASKS_PROMPT}\n\n## WEAKNESSES TO ADDRESS\n${weaknessBlock}\n\n## AVAILABLE MODULE MATERIALS\n${contextBlock}`,
      },
    ];

    const reply = await callDeepSeek(messages, {
      temperature: 0.5,
      maxTokens: 2000,
    });

    let tasks;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      tasks = parsed?.tasks || null;
    } catch {
      tasks = null;
    }

    if (!tasks) {
      return Response.json(
        { error: 'Failed to parse practice tasks', raw: reply },
        { status: 422 }
      );
    }

    return Response.json({ tasks });
  } catch (error) {
    console.error('Practice tasks API error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate practice tasks' },
      { status: 500 }
    );
  }
}
