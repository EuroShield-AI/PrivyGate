import { Mistral } from "@mistralai/mistralai";
import type { DetectedEntity, EntityType } from "./privacy-engine";

export interface AIDetectionResult {
  entities: Array<{
    type: EntityType;
    value: string;
    startIndex: number;
    endIndex: number;
    confidence: number;
  }>;
}

export class AIPIIDetector {
  private mistral: Mistral;

  constructor(apiKey: string) {
    this.mistral = new Mistral({ apiKey });
  }

  async detect(text: string): Promise<DetectedEntity[]> {
    const prompt = `Analyze the following text and identify all personally identifiable information (PII). 
Return a JSON object with an "entities" array. Each entity should have:
- "type": one of EMAIL, PHONE, NAME, ADDRESS, IBAN, IDENTIFIER
- "value": the exact text found
- "startIndex": character position where it starts in the original text
- "endIndex": character position where it ends
- "confidence": number between 0 and 1

Text to analyze:
${text}

Return ONLY valid JSON in this format:
{
  "entities": [
    {
      "type": "EMAIL",
      "value": "example@email.com",
      "startIndex": 10,
      "endIndex": 28,
      "confidence": 0.95
    }
  ]
}`;

    try {
      const response = await this.mistral.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" },
        temperature: 0.1, // Lower temperature for more consistent detection
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in Mistral response");
      }

      const parsed = JSON.parse(content) as AIDetectionResult;
      
      // Validate and find actual positions in text
      const entities: DetectedEntity[] = [];
      for (const entity of parsed.entities || []) {
        // Find the actual position in the text if startIndex/endIndex are not accurate
        const actualIndex = text.indexOf(entity.value);
        if (actualIndex !== -1) {
          entities.push({
            type: entity.type as EntityType,
            value: entity.value,
            startIndex: actualIndex,
            endIndex: actualIndex + entity.value.length,
            confidence: Math.max(0, Math.min(1, entity.confidence || 0.8)),
          });
        }
      }

      return entities;
    } catch (error) {
      console.error("AI detection error:", error);
      // Fallback to empty array if AI fails
      return [];
    }
  }
}
