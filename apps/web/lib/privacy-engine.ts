export type EntityType = 
  | "EMAIL"
  | "PHONE"
  | "NAME"
  | "ADDRESS"
  | "IBAN"
  | "IDENTIFIER";

export interface DetectedEntity {
  type: EntityType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
const IBAN_REGEX = /[A-Z]{2}\d{2}[A-Z0-9]{4,30}/g;

export class PIIDetector {
  detect(text: string): DetectedEntity[] {
    const entities: DetectedEntity[] = [];

    // Email detection
    let match;
    while ((match = EMAIL_REGEX.exec(text)) !== null) {
      entities.push({
        type: "EMAIL",
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
      });
    }

    // Phone detection
    EMAIL_REGEX.lastIndex = 0;
    while ((match = PHONE_REGEX.exec(text)) !== null) {
      const phone = match[0].trim();
      if (phone.length >= 7 && phone.length <= 20) {
        entities.push({
          type: "PHONE",
          value: phone,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          confidence: 0.85,
        });
      }
    }

    // IBAN detection
    PHONE_REGEX.lastIndex = 0;
    while ((match = IBAN_REGEX.exec(text)) !== null) {
      const iban = match[0];
      if (iban.length >= 15 && iban.length <= 34) {
        entities.push({
          type: "IBAN",
          value: iban,
          startIndex: match.index,
          endIndex: match.index + iban.length,
          confidence: 0.90,
        });
      }
    }

    // Name detection (heuristic: capitalized words, 2-3 words, common patterns)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g;
    IBAN_REGEX.lastIndex = 0;
    while ((match = namePattern.exec(text)) !== null) {
      const name = match[0];
      // Skip if it's part of an email or other entity
      const isOverlapping = entities.some(
        (e) =>
          (match.index >= e.startIndex && match.index < e.endIndex) ||
          (match.index + name.length > e.startIndex &&
            match.index + name.length <= e.endIndex)
      );
      if (!isOverlapping) {
        entities.push({
          type: "NAME",
          value: name,
          startIndex: match.index,
          endIndex: match.index + name.length,
          confidence: 0.70,
        });
      }
    }

    // Sort by start index
    return entities.sort((a, b) => a.startIndex - b.startIndex);
  }
}

export class PseudonymizationVault {
  private tokenMap: Map<string, string> = new Map();
  private reverseMap: Map<string, string> = new Map();
  private counters: Map<EntityType, number> = new Map();

  generateToken(entityType: EntityType): string {
    const count = (this.counters.get(entityType) || 0) + 1;
    this.counters.set(entityType, count);
    return `${entityType}_${count}`;
  }

  addMapping(original: string, token: string): void {
    this.tokenMap.set(original, token);
    this.reverseMap.set(token, original);
  }

  getToken(original: string): string | undefined {
    return this.tokenMap.get(original);
  }

  getOriginal(token: string): string | undefined {
    return this.reverseMap.get(token);
  }

  pseudonymize(text: string, entities: DetectedEntity[]): string {
    // Process entities in reverse order to maintain indices
    let result = text;
    const sortedEntities = [...entities].sort(
      (a, b) => b.startIndex - a.startIndex
    );

    for (const entity of sortedEntities) {
      let token = this.getToken(entity.value);
      if (!token) {
        token = this.generateToken(entity.type);
        this.addMapping(entity.value, token);
      }
      result =
        result.slice(0, entity.startIndex) +
        token +
        result.slice(entity.endIndex);
    }

    return result;
  }

  reinject(text: string, allowedTypes?: EntityType[]): string {
    let result = text;
    const tokenRegex = /(EMAIL|PHONE|NAME|ADDRESS|IBAN|IDENTIFIER)_\d+/g;
    const matches = Array.from(result.matchAll(tokenRegex));

    // Process in reverse to maintain indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const token = match[0];
      const original = this.getOriginal(token);

      if (original) {
        const entityType = token.split("_")[0] as EntityType;
        if (!allowedTypes || allowedTypes.includes(entityType)) {
          result =
            result.slice(0, match.index) +
            original +
            result.slice(match.index + token.length);
        }
      }
    }

    return result;
  }

  clear(): void {
    this.tokenMap.clear();
    this.reverseMap.clear();
    this.counters.clear();
  }
}
