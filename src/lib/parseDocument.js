/**
 * Client-side document parser — extracts text from PDF, DOCX, XLSX, PPTX, TXT
 * Files never leave the browser.
 */

const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/markdown': 'md',
};

/**
 * Returns the document type string for a given File, or null if unsupported.
 */
export function getDocType(file) {
  if (SUPPORTED_TYPES[file.type]) return SUPPORTED_TYPES[file.type];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extMap = {
    pdf: 'pdf', docx: 'docx', doc: 'doc',
    xlsx: 'xlsx', xls: 'xls', csv: 'csv',
    pptx: 'pptx', ppt: 'ppt',
    txt: 'txt', md: 'md',
  };
  return extMap[ext] || null;
}

/**
 * Extracts plain text from a File object.
 * All parsing happens in the browser — no server round-trip.
 */
export async function parseDocument(file) {
  const docType = getDocType(file);
  if (!docType) throw new Error(`Unsupported file type: ${file.name}`);

  switch (docType) {
    case 'pdf':
      return parsePDF(file);
    case 'docx':
      return parseDOCX(file);
    case 'xlsx':
    case 'xls':
    case 'csv':
      return parseSpreadsheet(file);
    case 'pptx':
      return parsePPTX(file);
    case 'txt':
    case 'md':
      return file.text();
    case 'doc':
    case 'ppt':
      throw new Error(
        `Legacy .${docType} format is not supported. Please save as .${docType}x and try again.`
      );
    default:
      throw new Error(`Unsupported file type: ${docType}`);
  }
}

// ─── PDF ───────────────────────────────────────────────────────────────
async function parsePDF(file) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Use fake worker to avoid worker file issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

// ─── DOCX ──────────────────────────────────────────────────────────────
async function parseDOCX(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// ─── XLSX / XLS / CSV ──────────────────────────────────────────────────
async function parseSpreadsheet(file) {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return sheets.join('\n\n');
}

// ─── PPTX ──────────────────────────────────────────────────────────────
async function parsePPTX(file) {
  // PPTX is a ZIP of XML files. We extract text from slide XMLs.
  const JSZip = (await import('jszip')).default;
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slides = [];
  const slideFiles = Object.keys(zip.files)
    .filter((f) => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)[1]);
      const nb = parseInt(b.match(/slide(\d+)/)[1]);
      return na - nb;
    });

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('text');
    // Extract text between <a:t> tags
    const textParts = [];
    const regex = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      textParts.push(match[1]);
    }
    if (textParts.length > 0) {
      const slideNum = slideFile.match(/slide(\d+)/)[1];
      slides.push(`--- Slide ${slideNum} ---\n${textParts.join(' ')}`);
    }
  }

  return slides.join('\n\n');
}

/**
 * Returns the accepted file extensions string for <input accept="">
 */
export const ACCEPTED_FILE_TYPES =
  '.pdf,.docx,.xlsx,.xls,.csv,.pptx,.txt,.md';
