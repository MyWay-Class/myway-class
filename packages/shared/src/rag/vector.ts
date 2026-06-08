const VECTOR_DIMENSIONS = 12;

export function normalizeText(text: string): string {
  return text.replaceAll(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-zA-Z0-9가-힣]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

export function buildEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return [];
  }

  const vector = new Array<number>(VECTOR_DIMENSIONS).fill(0);
  for (const token of tokens) {
    const bucket = Math.abs(hashToken(token)) % VECTOR_DIMENSIONS;
    const weight = 1 + Math.min(0.5, token.length / 24);
    vector[bucket] += weight;
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm <= 0) {
    return [];
  }

  return vector.map((value) => Math.round((value / norm) * 1000) / 1000);
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const size = Math.min(left.length, right.length);
  if (size === 0) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < size; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }

  if (leftNorm <= 0 || rightNorm <= 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function hashToken(token: string): number {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = Math.imul(31, hash) + token.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
