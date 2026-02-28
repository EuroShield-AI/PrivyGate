import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");

export async function ensureUploadDir(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<{ filePath: string; filename: string }> {
  await ensureUploadDir();

  const ext = originalName.split(".").pop() || "";
  const filename = `${randomUUID()}.${ext}`;
  const filePath = join(UPLOAD_DIR, filename);

  await writeFile(filePath, buffer);

  return { filePath, filename };
}

export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
