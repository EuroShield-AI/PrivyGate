import * as mammoth from "mammoth";
import PDFParser from "pdf2json";

export interface ExtractedText {
  text: string;
  pageCount?: number;
  wordCount: number;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, 1);
      let fullText = "";
      let pageCount = 0;

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(new Error(`PDF parsing error: ${errData.parserError}`));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          pageCount = pdfData.Pages?.length || 0;
          
          // Extract text from all pages
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R) {
                    textItem.R.forEach((run: any) => {
                      if (run.T) {
                        // Decode URI-encoded text
                        try {
                          fullText += decodeURIComponent(run.T) + " ";
                        } catch (e) {
                          fullText += run.T + " ";
                        }
                      }
                    });
                  }
                });
              }
            });
          }

          resolve({
            text: fullText.trim(),
            pageCount,
            wordCount: fullText.split(/\s+/).length,
          });
        } catch (error) {
          reject(new Error(`Failed to process PDF data: ${error}`));
        }
      });

      // Parse the PDF buffer
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      reject(new Error(`Failed to extract text from PDF: ${error}`));
    }
  });
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
