import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchSimilarChunks } from "@/lib/vector-db";

const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).default(5),
  fileId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit, fileId } = searchSchema.parse(body);

    const results = await searchSimilarChunks(query, limit, fileId);

    return NextResponse.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Vector search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
