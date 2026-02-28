import { ChromaClient } from "chromadb";
import { chunkText } from "./file-extractor";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "privygate_documents";

let chromaClient: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      path: CHROMA_URL,
    });
  }
  return chromaClient;
}

export async function ensureCollection(): Promise<string> {
  const client = getChromaClient();
  
  try {
    // Try to get existing collection
    const collection = await client.getCollection({
      name: COLLECTION_NAME,
    });
    return collection.id;
  } catch (error) {
    // Collection doesn't exist, create it
    const collection = await client.createCollection({
      name: COLLECTION_NAME,
      metadata: { description: "PrivyGate document chunks" },
    });
    return collection.id;
  }
}

export async function storeDocumentChunks(
  fileId: string,
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<string[]> {
  const client = getChromaClient();
  const collectionId = await ensureCollection();
  const collection = await client.getCollection({
    id: collectionId,
  });

  // Chunk the text
  const chunks = chunkText(text, 2000, 200);
  const chunkIds: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${fileId}_chunk_${i}`;
    chunkIds.push(chunkId);

    await collection.add({
      ids: [chunkId],
      documents: [chunks[i]],
      metadatas: [
        {
          fileId,
          chunkIndex: i,
          ...metadata,
        },
      ],
    });
  }

  return chunkIds;
}

export async function searchSimilarChunks(
  query: string,
  limit: number = 5,
  fileId?: string
): Promise<Array<{ id: string; content: string; metadata: Record<string, unknown>; distance: number }>> {
  const client = getChromaClient();
  
  try {
    const collection = await client.getCollection({
      name: COLLECTION_NAME,
    });

    const where: Record<string, unknown> = {};
    if (fileId) {
      where.fileId = fileId;
    }

    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where,
    });

    if (!results.documents || !results.documents[0]) {
      return [];
    }

    return results.documents[0].map((doc, idx) => ({
      id: results.ids[0][idx],
      content: doc,
      metadata: (results.metadatas?.[0]?.[idx] as Record<string, unknown>) || {},
      distance: results.distances?.[0]?.[idx] || 0,
    }));
  } catch (error) {
    console.error("Vector search error:", error);
    return [];
  }
}

export async function deleteDocumentChunks(fileId: string): Promise<void> {
  const client = getChromaClient();
  
  try {
    const collection = await client.getCollection({
      name: COLLECTION_NAME,
    });

    // Get all chunks for this file
    const results = await collection.get({
      where: { fileId },
    });

    if (results.ids && results.ids.length > 0) {
      await collection.delete({
        ids: results.ids,
      });
    }
  } catch (error) {
    console.error("Delete chunks error:", error);
  }
}
