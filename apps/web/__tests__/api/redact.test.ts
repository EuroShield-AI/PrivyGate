/**
 * Integration tests for /api/redact endpoint
 * These tests verify critical PII detection and redaction functionality
 */

import { PIIDetector } from '@/lib/privacy-engine';

describe('PII Detection and Redaction', () => {
  test('should detect multiple PII types in text', () => {
    const detector = new PIIDetector();
    const text = `
      John Doe lives at 123 Main St, New York, NY 10001.
      Contact him at john.doe@example.com or call +1-555-123-4567.
      Bank account: GB82WEST12345698765432
    `;

    const entities = detector.detect(text);

    expect(entities.length).toBeGreaterThan(0);
    
    const hasEmail = entities.some(e => e.type === 'EMAIL');
    const hasPhone = entities.some(e => e.type === 'PHONE');
    const hasIban = entities.some(e => e.type === 'IBAN');

    expect(hasEmail).toBe(true);
    expect(hasPhone).toBe(true);
    expect(hasIban).toBe(true);
  });

  test('should handle empty text', () => {
    const detector = new PIIDetector();
    const entities = detector.detect('');
    expect(entities).toEqual([]);
  });

  test('should handle text with no PII', () => {
    const detector = new PIIDetector();
    const text = 'This is a simple text without any personal information.';
    const entities = detector.detect(text);
    expect(entities).toEqual([]);
  });
});
