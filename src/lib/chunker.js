/**
 * Chunker — splits extracted text into overlapping chunks for RAG retrieval.
 * Each chunk ~300-500 tokens with metadata.
 */

const CHUNK_SIZE = 400; // target words per chunk
const CHUNK_OVERLAP = 50; // overlap words for context continuity

/**
 * Split text into chunks with metadata
 * @param {string} text - The full text to chunk
 * @param {object} meta - Metadata: { sourceId, sourceType, sourceName }
 * @returns {Array<{chunkId, text, sourceId, sourceType, sourceName, index}>}
 */
export function chunkText(text, meta = {}) {
  if (!text || !text.trim()) return [];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const currentWords = currentChunk.split(/\s+/).filter(Boolean).length;
    const paraWords = trimmed.split(/\s+/).filter(Boolean).length;

    if (currentWords + paraWords > CHUNK_SIZE && currentChunk) {
      chunks.push(createChunk(currentChunk.trim(), chunkIndex++, meta));
      // Keep overlap
      const words = currentChunk.split(/\s+/).filter(Boolean);
      currentChunk =
        words.slice(-CHUNK_OVERLAP).join(' ') + '\n\n' + trimmed;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }

  // Push remaining
  if (currentChunk.trim()) {
    chunks.push(createChunk(currentChunk.trim(), chunkIndex, meta));
  }

  return chunks;
}

function createChunk(text, index, meta) {
  return {
    chunkId: `${meta.sourceId || 'src'}_chunk_${index}`,
    text,
    sourceId: meta.sourceId || '',
    sourceType: meta.sourceType || '',
    sourceName: meta.sourceName || '',
    index,
  };
}
