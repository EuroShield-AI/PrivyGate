import { Mistral } from "@mistralai/mistralai";
import { z } from "zod";

// Note: mistralClient is deprecated. Use user-specific API keys via getMistralApiKey()
// This export is kept for backward compatibility but should not be used in new code
export const mistralClient = process.env.MISTRAL_API_KEY 
  ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY })
  : null;

export async function callMistralWithSchema<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model: string = "mistral-large-latest"
): Promise<T> {
  const response = await mistralClient.chat.complete({
    model,
    messages: [{ role: "user", content: prompt }],
    responseFormat: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in Mistral response");
  }

  try {
    const json = JSON.parse(content);
    return schema.parse(json);
  } catch (error) {
    throw new Error(`Failed to parse or validate Mistral response: ${error}`);
  }
}

export async function summarizeText(text: string): Promise<string> {
  const prompt = `Summarize the following text in 2-3 sentences:\n\n${text}`;
  const response = await mistralClient.chat.complete({
    model: "mistral-large-latest",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content || "";
}

export async function extractActions(text: string): Promise<{
  actions: Array<{ action: string; priority: string }>;
}> {
  const schema = z.object({
    actions: z.array(
      z.object({
        action: z.string(),
        priority: z.enum(["high", "medium", "low"]),
      })
    ),
  });

  const prompt = `Extract actionable items from the following text. Return as JSON with an "actions" array containing objects with "action" (string) and "priority" (high/medium/low) fields:\n\n${text}`;

  return callMistralWithSchema(prompt, schema);
}

export async function classifyText(text: string): Promise<{
  category: string;
  sentiment: string;
  urgency: string;
}> {
  const schema = z.object({
    category: z.string(),
    sentiment: z.enum(["positive", "neutral", "negative"]),
    urgency: z.enum(["low", "medium", "high"]),
  });

  const prompt = `Classify the following text. Return JSON with "category" (string), "sentiment" (positive/neutral/negative), and "urgency" (low/medium/high):\n\n${text}`;

  return callMistralWithSchema(prompt, schema);
}
