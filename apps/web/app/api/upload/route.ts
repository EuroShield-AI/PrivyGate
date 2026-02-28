import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveUploadedFile, getMimeType } from "@/lib/upload";
import { extractTextFromFile } from "@/lib/file-extractor";
import { AuditLogger } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const mimeType = getMimeType(file.name);
    if (
      !mimeType.includes("pdf") &&
      !mimeType.includes("wordprocessingml") &&
      !mimeType.includes("msword")
    ) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file to disk
    const { filePath, filename } = await saveUploadedFile(buffer, file.name);

    // Extract text
    const extracted = await extractTextFromFile(buffer, mimeType);

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename,
        originalName: file.name,
        mimeType,
        size: file.size,
        filePath,
        extractedText: extracted.text,
      },
    });

    // Create audit log
    const auditLogger = new AuditLogger();
    await prisma.auditLog.create({
      data: {
        jobId: fileRecord.id, // Using file ID as temporary job ID
        eventType: "FILE_UPLOADED",
        timestamp: new Date(),
        metadata: JSON.stringify({
          filename: file.name,
          size: file.size,
          mimeType,
          wordCount: extracted.wordCount,
          pageCount: extracted.pageCount,
        }),
      },
    });

    return NextResponse.json({
      fileId: fileRecord.id,
      filename: file.name,
      extractedText: extracted.text,
      wordCount: extracted.wordCount,
      pageCount: extracted.pageCount,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
