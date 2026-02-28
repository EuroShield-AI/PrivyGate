import { PIIDetector, PseudonymizationVault } from '@/lib/privacy-engine';

describe('PIIDetector', () => {
  let detector: PIIDetector;

  beforeEach(() => {
    detector = new PIIDetector();
  });

  test('should detect email addresses', () => {
    const text = 'Contact john.doe@example.com for more information';
    const entities = detector.detect(text);
    
    expect(entities.length).toBeGreaterThan(0);
    const emailEntity = entities.find(e => e.type === 'EMAIL');
    expect(emailEntity).toBeDefined();
    expect(emailEntity?.value).toBe('john.doe@example.com');
    expect(emailEntity?.confidence).toBeGreaterThan(0);
  });

  test('should detect phone numbers', () => {
    const text = 'Call us at +1-555-123-4567 or 555-987-6543';
    const entities = detector.detect(text);
    
    const phoneEntities = entities.filter(e => e.type === 'PHONE');
    expect(phoneEntities.length).toBeGreaterThan(0);
  });

  test('should detect IBANs', () => {
    const text = 'Bank account: GB82WEST12345698765432';
    const entities = detector.detect(text);
    
    const ibanEntity = entities.find(e => e.type === 'IBAN');
    expect(ibanEntity).toBeDefined();
    expect(ibanEntity?.value).toContain('GB82');
  });

  test('should return empty array for text without PII', () => {
    const text = 'This is a simple text without any personal information.';
    const entities = detector.detect(text);
    
    expect(entities).toEqual([]);
  });
});

describe('PseudonymizationVault', () => {
  let vault: PseudonymizationVault;

  beforeEach(() => {
    vault = new PseudonymizationVault();
  });

  test('should pseudonymize detected entities', () => {
    const text = 'Contact john.doe@example.com';
    const entities = [
      {
        type: 'EMAIL' as const,
        value: 'john.doe@example.com',
        startIndex: 8,
        endIndex: 28,
        confidence: 0.95,
      },
    ];

    const redacted = vault.pseudonymize(text, entities);
    
    expect(redacted).not.toContain('john.doe@example.com');
    expect(redacted).toMatch(/EMAIL_\d+/);
  });

  test('should generate unique tokens for different values', () => {
    const text = 'Email: john@example.com and jane@example.com';
    const entities = [
      {
        type: 'EMAIL' as const,
        value: 'john@example.com',
        startIndex: 7,
        endIndex: 23,
        confidence: 0.95,
      },
      {
        type: 'EMAIL' as const,
        value: 'jane@example.com',
        startIndex: 28,
        endIndex: 44,
        confidence: 0.95,
      },
    ];

    const redacted = vault.pseudonymize(text, entities);
    const tokens = redacted.match(/EMAIL_\d+/g);
    
    expect(tokens).toBeDefined();
    expect(new Set(tokens).size).toBe(2); // Unique tokens
  });

  test('should retrieve original value using token', () => {
    const text = 'Contact john.doe@example.com';
    const entities = [
      {
        type: 'EMAIL' as const,
        value: 'john.doe@example.com',
        startIndex: 8,
        endIndex: 28,
        confidence: 0.95,
      },
    ];

    vault.pseudonymize(text, entities);
    const token = vault.getToken('john.doe@example.com');
    
    expect(token).toBeDefined();
    expect(token).toMatch(/EMAIL_\d+/);
  });
});
