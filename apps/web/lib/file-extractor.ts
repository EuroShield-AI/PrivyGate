import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export interface ExtractedText {
  text: string;
  pageCount?: number;
  wordCount: number;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).length,
    };
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<ExtractedText> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    return {
      text,
      wordCount: text.split(/\s+/).length,
    };
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error}`);
  }
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractedText> {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDOCX(buffer);
  } else if (mimeType === "application/msword") {
    throw new Error("Legacy .doc format not supported. Please convert to .docx");
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

export function chunkText(
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end);

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastNewline = chunk.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }

    chunks.push(chunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}
