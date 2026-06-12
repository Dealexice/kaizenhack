/**
 * DeepSeek API client — server-side only
 */

const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Call DeepSeek Chat API
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - { temperature, maxTokens }
 * @returns {Promise<string>} The assistant's response text
 */
export async function callDeepSeek(messages, options = {}) {
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
    throw new Error('DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local');
  }

  const response = await fetch(`${DEEPSEEK_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
