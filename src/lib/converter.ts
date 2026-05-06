import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Wire up the pdf.js worker. Vite resolves this URL at build time.
// The .mjs build is required for Vite 6 / native ESM.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

let aiClient: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

const getAIClient = () => {
  const localKey = localStorage.getItem('gemini_api_key');
  const sessionKey = sessionStorage.getItem('gemini_api_key');
  // NOTE: We deliberately do NOT read process.env.GEMINI_API_KEY here.
  // Vite no longer injects it (see vite.config.ts) — that prevented a leak
  // of the deployer's key into the client bundle. This is a BYOK app: the
  // user supplies their key via the Settings drawer, it lives only in their
  // browser storage, and it travels directly from their browser to Google.
  const activeKey = sessionKey || localKey;

  if (!activeKey) {
    throw new Error("Gemini API key is missing. Please add a key in the settings panel.");
  }

  // Re-initialize if the key has changed
  if (!aiClient || currentApiKey !== activeKey) {
    aiClient = new GoogleGenAI({ apiKey: activeKey });
    currentApiKey = activeKey;
  }
  
  return aiClient;
};

export type OutputFormat = 'HTML' | 'JSON' | 'TXT' | 'MD';

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'success' | 'error';
  targetFormat: OutputFormat;
  resultContent?: string;
  errorMessage?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.onabort = () => reject(new Error('File reading aborted'));
  });
};

/**
 * Try to extract text from a PDF locally using pdf.js.
 * Returns the extracted text, or `null` if the PDF appears to be scan-only
 * (no extractable text on any page) — in which case the caller should fall
 * back to a vision-capable model.
 *
 * This is the "fast path": local extraction is free in API tokens, ~10x
 * faster than a Gemini round-trip, and preserves the original characters
 * (including Polish diacritics) without OCR drift.
 */
const extractTextFromPDFLocally = async (file: File): Promise<string | null> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    // Each item is one text chunk; join with spaces, separate pages with double newline.
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText.length > 0) {
      pageTexts.push(pageText);
    }
  }

  // If we got nothing from any page, this is almost certainly a scan/image PDF.
  // Signal that to the caller so it can fall back to Gemini vision.
  if (pageTexts.length === 0) {
    return null;
  }

  // Heuristic: if total extracted text is implausibly short relative to file size,
  // it's likely a scan with embedded thumbnail text only. Threshold tuned conservatively.
  const totalChars = pageTexts.reduce((sum, t) => sum + t.length, 0);
  const minCharsPerKB = 0.5; // 0.5 chars per KB of file size = clearly a scan
  const fileKB = file.size / 1024;
  if (totalChars / fileKB < minCharsPerKB && fileKB > 100) {
    return null;
  }

  return pageTexts.join('\n\n');
};

const extractTextFromPPTX = async (file: File, targetFormat: OutputFormat): Promise<string> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  let fullText = '';
  
  const slideRegex = /ppt\/slides\/slide\d+\.xml/;
  const slides = Object.keys(loadedZip.files).filter(name => slideRegex.test(name));
  
  let slideIndex = 1;
  for (const slideName of slides) {
    const content = await loadedZip.files[slideName].async('text');
    const matches = content.match(/<a:t>(.*?)<\/a:t>/g);
    if (matches) {
      const slideText = matches.map(m => m.replace(/<a:t>/, '').replace(/<\/a:t>/, '')).join(' ');
      if (targetFormat === 'MD') {
        fullText += `## Slide ${slideIndex}\n\n${slideText}\n\n`;
      } else {
        fullText += slideText + '\n\n';
      }
    }
    slideIndex++;
  }
  return fullText;
};

const sheetToMarkdownTable = (sheet: XLSX.WorkSheet): string => {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rows || rows.length === 0) return '';
  
  const maxCols = Math.max(...rows.map(r => r.length));
  if (maxCols === 0) return '';

  const headers = Array.from({length: maxCols}, (_, i) => String(rows[0][i] || '').replace(/\|/g, '\\|').replace(/\n/g, ' '));
  let md = `| ${headers.join(' | ')} |\n`;
  md += `| ${headers.map(() => '---').join(' | ')} |\n`;
  
  for (let i = 1; i < rows.length; i++) {
    const row = Array.from({length: maxCols}, (_, colIdx) => String(rows[i][colIdx] || '').replace(/\|/g, '\\|').replace(/\n/g, ' '));
    md += `| ${row.join(' | ')} |\n`;
  }
  return md;
};

const formatText = (text: string, format: OutputFormat): string => {
  switch (format) {
    case 'HTML':
      return `<div>\n<p>${text.replace(/\n/g, '</p>\n<p>')}</p>\n</div>`;
    case 'JSON':
      return JSON.stringify({ content: text }, null, 2);
    case 'MD':
      return text;
    case 'TXT':
    default:
      return text;
  }
};

export const convertFile = async (fileItem: FileItem): Promise<string> => {
  const { file, targetFormat } = fileItem;
  const mimeType = file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Local Conversion for Office Documents
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    if (targetFormat === 'HTML') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return `<article>\n${result.value}\n</article>`;
    } else if (targetFormat === 'MD') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      let md = result.value
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
        .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<ul>(.*?)<\/ul>/g, '$1\n')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '');
      return md.trim();
    } else {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return formatText(result.value, targetFormat);
    }
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let combinedText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      if (targetFormat === 'HTML') {
        combinedText += `<h2>${sheetName}</h2>\n` + XLSX.utils.sheet_to_html(sheet) + '\n';
      } else if (targetFormat === 'JSON') {
        const json = XLSX.utils.sheet_to_json(sheet);
        combinedText += JSON.stringify({ sheet: sheetName, data: json }, null, 2) + '\n';
      } else if (targetFormat === 'MD') {
        combinedText += `## ${sheetName}\n\n${sheetToMarkdownTable(sheet)}\n\n`;
      } else {
        const csv = XLSX.utils.sheet_to_csv(sheet);
        combinedText += `--- ${sheetName} ---\n${csv}\n\n`;
      }
    });
    
    if (targetFormat === 'JSON') {
      // Wrap multiple JSON sheets into an array if needed, but string concat is fine for simple output
      return combinedText; 
    }
    return combinedText;
  }

  if (extension === 'pptx') {
    const text = await extractTextFromPPTX(file, targetFormat);
    return targetFormat === 'MD' ? text : formatText(text, targetFormat);
  }

  // PDF FAST PATH: try local text extraction first.
  // For text-based PDFs (Word exports, generated reports, etc.) this is free
  // in API tokens and preserves Polish diacritics perfectly. Only fall through
  // to the Gemini vision path when local extraction returns null (= scan).
  if (extension === 'pdf') {
    try {
      const localText = await extractTextFromPDFLocally(file);
      if (localText !== null) {
        return formatText(localText, targetFormat);
      }
      // null = scan-only PDF; fall through to AI vision path below.
    } catch (err) {
      // Corrupted or password-protected PDF — try the AI path as a last resort.
      console.warn('Local PDF extraction failed, falling back to Gemini:', err);
    }
  }

  // AI Conversion for Images and scan-only PDFs
  const supportedGenAIMimes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

  let effectiveMimeType = mimeType;
  if (!mimeType) {
    if (extension === 'jpg' || extension === 'jpeg') effectiveMimeType = 'image/jpeg';
    else if (extension === 'png') effectiveMimeType = 'image/png';
    else if (extension === 'pdf') effectiveMimeType = 'application/pdf';
    else if (extension === 'heic') effectiveMimeType = 'image/heic';
    else if (['raw', 'cr2', 'nef', 'orf', 'arw', 'dng'].includes(extension || '')) effectiveMimeType = 'image/jpeg';
  } else if (['raw', 'cr2', 'nef', 'orf', 'arw', 'dng'].includes(extension || '')) {
    effectiveMimeType = 'image/jpeg'; // Force jpeg for raw extensions so Gemini tries to process it
  }

  if (supportedGenAIMimes.includes(effectiveMimeType) || effectiveMimeType.startsWith('image/')) {
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File is too large for AI conversion (max 20MB limit).');
    }
    const base64Data = await fileToBase64(file);

    // LANGUAGE PRESERVATION: Gemini's default behavior on multilingual content can
    // drift toward English translation, especially for less-represented languages.
    // This directive is prepended to every prompt to anchor the output language and
    // protect non-ASCII characters (Polish ą/ć/ę/ł/ń/ó/ś/ź/ż, German umlauts, etc.).
    const LANGUAGE_DIRECTIVE = `IMPORTANT — LANGUAGE PRESERVATION: Detect the language of the source document and produce the output in the SAME language. Do NOT translate. Preserve ALL diacritical marks and special characters exactly as they appear in the source (for example, Polish: ą ć ę ł ń ó ś ź ż; German: ä ö ü ß; etc.). If the document is in Polish, the output must be in Polish with all diacritics intact.`;

    let prompt = '';
    if (targetFormat === 'JSON') {
      prompt = `${LANGUAGE_DIRECTIVE}\n\nExtract all text, data, and meaningful content from this document/image. Output a valid JSON object containing the extracted information. Ensure the JSON is well-formed.`;
    } else if (targetFormat === 'HTML') {
      prompt = `${LANGUAGE_DIRECTIVE}\n\nExtract all text, data, and meaningful content from this document/image. Output Clean, Semantic HTML. Use proper tags (<article>, <section>, <h1>, <p>, <ul>, <table>). Do not include \`\`\`html wrappers.`;
    } else if (effectiveMimeType.startsWith('image/')) {
      prompt = `${LANGUAGE_DIRECTIVE}\n\nVISION OCR PIPELINE: Perform highly accurate Optical Character Recognition (OCR) on this image. Extract all text precisely. Preserve formatting, tables, and paragraphs as ${targetFormat}. Do not include markdown wrappers like \`\`\`md.`;
    } else {
      prompt = `${LANGUAGE_DIRECTIVE}

Extract all text, data, and meaningful content from this document/image.
Format the output STRICTLY as ${targetFormat}.
Do not include any markdown formatting blocks like \`\`\`html or \`\`\`json around the output, just return the raw ${targetFormat} content.
If it's a document, extract the text preserving the structure as best as possible in ${targetFormat}.`;
    }

    const response = await getAIClient().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: effectiveMimeType,
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: targetFormat === 'JSON' ? { responseMimeType: 'application/json' } : undefined
    });

    let text = response.text || '';
    
    if (targetFormat === 'JSON') {
      try {
        // Ensure it's pretty printed
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Fallback if not valid JSON
        return JSON.stringify({ content: text }, null, 2);
      }
    }

    return text;
  }

  // Fallback for unsupported types (like RAW if not supported by browser/Gemini)
  // We will just read it as text if possible, or throw an error.
  if (extension === 'txt' || extension === 'md' || extension === 'json' || extension === 'html') {
    const text = await file.text();
    return formatText(text, targetFormat);
  }

  throw new Error(`Unsupported file type: ${extension || mimeType}`);
};
