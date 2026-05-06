import { encode } from 'gpt-tokenizer';

/**
 * Count tokens in a string using the GPT-4 tokenizer (cl100k_base).
 *
 * Why this tokenizer for a Gemini-based app?
 *   - cl100k_base is the de-facto reference. Numbers transfer well to other
 *     LLMs as a "rule of thumb": Anthropic and Gemini tokenizers diverge
 *     by roughly ±10% from cl100k_base for typical prose, with the same
 *     directional behaviour (HTML > MD ~ TXT, English < Polish).
 *   - It runs entirely in the browser without WASM, so adding it does not
 *     bloat startup or require a server round-trip.
 *
 * For users who want a precise count for a specific model, the displayed
 * number is labelled as an estimate (~).
 */
export const countTokens = (text: string): number => {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch (err) {
    // gpt-tokenizer can throw on extremely large strings or invalid UTF-16
    // sequences. Fall back to a calibrated character-based heuristic.
    // Mixed-language average: ~3.5 chars per token.
    console.warn('Token counting failed, using heuristic:', err);
    return Math.ceil(text.length / 3.5);
  }
};

/**
 * Format a token count for display: 1547 -> "1,547".
 */
export const formatTokenCount = (count: number): string => {
  return count.toLocaleString('en-US');
};

/**
 * Estimate the input-side token count of a raw file BEFORE conversion.
 * For text-extractable formats we use the actual extracted text; for binary
 * formats we provide a coarse estimate based on file size and format.
 *
 * This is intentionally a rough heuristic — its purpose is to communicate
 * the order of magnitude of savings, not to be a precise meter.
 */
export const estimateRawFileTokens = (file: File): number => {
  const sizeKB = file.size / 1024;
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Image / scan files: vision encoding cost is dominated by tile count, not
  // text content. Gemini docs put a typical image at ~258-1290 tokens depending
  // on resolution. We use a conservative middle estimate.
  if (['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif', 'raw', 'cr2', 'nef', 'orf', 'arw', 'dng'].includes(ext || '')) {
    return 1000;
  }

  // PDFs vary wildly. Use a size-based estimate that approximates real-world
  // token cost when the PDF goes through vision (~1000 tokens per page,
  // roughly 50-100 KB per page for text PDFs).
  if (ext === 'pdf') {
    return Math.round(sizeKB * 12);
  }

  // For office files, bytes-per-token is poor (lots of binary structure).
  // Estimate at ~1 token per 8 bytes which approximates extractable content.
  if (['docx', 'xlsx', 'xls', 'pptx'].includes(ext || '')) {
    return Math.round(file.size / 8);
  }

  // Text-like fallback: file size / ~3.5 chars per token.
  return Math.round(file.size / 3.5);
};

/**
 * Calculate savings between raw input and converted output.
 * Returns null if there is no meaningful saving (output is bigger or equal).
 */
export const calculateSavings = (rawTokens: number, outputTokens: number): { absolute: number; percent: number } | null => {
  if (outputTokens >= rawTokens) return null;
  const absolute = rawTokens - outputTokens;
  const percent = Math.round((absolute / rawTokens) * 100);
  return { absolute, percent };
};
