import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/encryption";

export async function getMistralApiKey(userId: string): Promise<string | null> {
  try {
    const userResults = await db.select({
      mistralApiKey: users.mistralApiKey,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResults[0];
    if (!user || !user.mistralApiKey) {
      return null;
    }

    // Decrypt the API key
    if (!process.env.ENCRYPTION_SECRET) {
      throw new Error("ENCRYPTION_SECRET not configured");
    }

    return decrypt(user.mistralApiKey, process.env.ENCRYPTION_SECRET);
  } catch (error) {
    console.error("Error retrieving Mistral API key:", error);
    return null;
  }
}

export async function saveMistralApiKey(userId: string, apiKey: string): Promise<void> {
  try {
    if (!process.env.ENCRYPTION_SECRET) {
      throw new Error("ENCRYPTION_SECRET not configured");
    }

    // Encrypt the API key
    const encrypted = encrypt(apiKey, process.env.ENCRYPTION_SECRET);

    // Update user record
    await db.update(users)
      .set({
        mistralApiKey: encrypted,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("Error saving Mistral API key:", error);
    throw error;
  }
}
