import { NextRequest, NextResponse } from "next/server";
import { db, files, vectorChunks, auditLogs } from "@/lib/db";
import { saveUploadedFile, getMimeType } from "@/lib/upload";
import { extractTextFromFile, chunkText } from "@/lib/file-extractor";
import { AuditLogger } from "@/lib/audit";
import { storeDocumentChunks } from "@/lib/vector-db";
import { v4 as uuidv4 } from "uuid";

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

    // Determine if we should use vector DB (for large files > 10k words)
    const useVectorDB = extracted.wordCount > 10000;
    let chunkCount = 0;
    let vectorIds: string[] = [];

    if (useVectorDB) {
      try {
        // Store chunks in vector database
        vectorIds = await storeDocumentChunks(
          "", // Will be updated after file creation
          extracted.text,
          {
            filename: file.name,
            wordCount: extracted.wordCount,
            pageCount: extracted.pageCount,
          }
        );
        chunkCount = vectorIds.length;
      } catch (error) {
        console.error("Vector DB storage error:", error);
        // Continue without vector DB if it fails
      }
    }

    // Save file record to database
    const fileId = uuidv4();
    await db.insert(files).values({
      id: fileId,
      filename,
      originalName: file.name,
      mimeType,
      size: file.size,
      filePath,
      extractedText: useVectorDB ? null : extracted.text, // Don't store full text if using vector DB
      chunkCount,
      useVectorDB: useVectorDB ? 1 : 0,
    });

    // Update vector chunks with file ID if vector DB was used
    if (useVectorDB && vectorIds.length > 0) {
      // Store chunk metadata in database
      const chunks = chunkText(extracted.text, 2000, 200);
      const chunkInserts = chunks.map((content, i) => ({
        id: uuidv4(),
        fileId,
        chunkIndex: i,
        content,
        vectorId: vectorIds[i] || null,
      }));
      
      if (chunkInserts.length > 0) {
        await db.insert(vectorChunks).values(chunkInserts);
      }
    }

    // Create audit log
    const auditLogger = new AuditLogger();
    await auditLogger.log(fileId, "FILE_UPLOADED", {
      filename: file.name,
      size: file.size,
      mimeType,
      wordCount: extracted.wordCount,
      pageCount: extracted.pageCount,
    });

    return NextResponse.json({
      fileId,
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
