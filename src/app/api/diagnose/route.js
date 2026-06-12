import { callDeepSeek } from '@/lib/deepseek';
import { SYSTEM_PROMPT, DIAGNOSIS_PROMPT } from '@/lib/systemPrompt';

export async function POST(request) {
  try {
    const { chunks, previousDiagnoses } = await request.json();

    if (!chunks || !chunks.length) {
      return Response.json(
        { error: 'No source chunks provided for diagnosis' },
        { status: 400 }
      );
    }

    // Build context with all chunks grouped by type
    const grouped = {};
    for (const c of chunks) {
      const type = c.sourceType || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(c);
    }

    let contextBlock = '';
    for (const [type, items] of Object.entries(grouped)) {
      contextBlock += `\n## ${type.replace(/_/g, ' ').toUpperCase()}\n\n`;
      for (const c of items) {
        contextBlock += `[ID: ${c.chunkId} | Source: ${c.sourceName}]\n${c.text}\n\n`;
      }
    }

    // Add previous diagnoses for recurring issue detection
    let recurringContext = '';
    if (previousDiagnoses && previousDiagnoses.length) {
      recurringContext =
        '\n\n## PREVIOUS DIAGNOSES (check for recurring issues)\n\n';
      for (const d of previousDiagnoses) {
        if (d.weaknesses) {
          recurringContext += d.weaknesses
            .map((w) => `- ${w.title}: ${w.description}`)
            .join('\n');
          recurringContext += '\n\n';
        }
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${DIAGNOSIS_PROMPT}\n\n## SOURCE MATERIALS\n${contextBlock}${recurringContext}`,
      },
    ];

    const reply = await callDeepSeek(messages, {
      temperature: 0.3,
      maxTokens: 3000,
    });

    // Parse JSON from response
    let diagnosis;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      diagnosis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      diagnosis = null;
    }

    if (!diagnosis) {
      return Response.json(
        { error: 'Failed to parse diagnosis. Raw response included.', raw: reply },
        { status: 422 }
      );
    }

    return Response.json({ diagnosis });
  } catch (error) {
    console.error('Diagnose API error:', error);
    return Response.json(
      { error: error.message || 'Failed to generate diagnosis' },
      { status: 500 }
    );
  }
}
