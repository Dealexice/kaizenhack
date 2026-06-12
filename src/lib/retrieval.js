/**
 * BM25-style retrieval — lightweight keyword matching for RAG.
 * No embeddings API needed. Scores chunks by term frequency relevance.
 */

/**
 * Tokenize text into lowercase terms, removing stopwords
 */
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could',
  'should','may','might','shall','can','to','of','in','for',
  'on','with','at','by','from','as','into','through','during',
  'before','after','above','below','between','out','up','down',
  'it','its','this','that','these','those','i','you','he','she',
  'we','they','me','him','her','us','them','my','your','his',
  'our','their','and','but','or','not','no','so','if','then',
  'than','too','very','just','about','also','only','more',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Compute term frequency map
 */
function termFrequency(tokens) {
  const tf = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  return tf;
}

/**
 * BM25 score computation
 * @param {string} query - User query
 * @param {Array<{chunkId, text}>} chunks - Document chunks
 * @param {number} k - Number of top results to return
 * @returns {Array<{chunkId, text, score, ...rest}>} Top-k scored chunks
 */
export function retrieveTopK(query, chunks, k = 8) {
  if (!chunks.length || !query.trim()) return [];

  const queryTokens = tokenize(query);
  if (!queryTokens.length) return chunks.slice(0, k);

  // BM25 parameters
  const k1 = 1.5;
  const b = 0.75;

  // Compute average doc length
  const docLengths = chunks.map((c) => tokenize(c.text).length);
  const avgDl = docLengths.reduce((a, b) => a + b, 0) / chunks.length;

  // Compute IDF for query terms
  const N = chunks.length;
  const df = {};
  for (const chunk of chunks) {
    const terms = new Set(tokenize(chunk.text));
    for (const t of queryTokens) {
      if (terms.has(t)) df[t] = (df[t] || 0) + 1;
    }
  }

  const idf = {};
  for (const t of queryTokens) {
    const n = df[t] || 0;
    idf[t] = Math.log((N - n + 0.5) / (n + 0.5) + 1);
  }

  // Score each chunk
  const scored = chunks.map((chunk, i) => {
    const tokens = tokenize(chunk.text);
    const tf = termFrequency(tokens);
    const dl = docLengths[i];

    let score = 0;
    for (const t of queryTokens) {
      const freq = tf[t] || 0;
      score +=
        (idf[t] || 0) *
        ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (dl / avgDl))));
    }

    return { ...chunk, score };
  });

  // Sort by score descending, return top-k
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((s) => s.score > 0);
}
