import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
  const secret = 'test-secret-key-for-encryption-testing-purposes-only';
  const testData = 'sensitive-data-12345';

  test('should encrypt and decrypt data correctly', () => {
    const encrypted = encrypt(testData, secret);
    expect(encrypted).not.toBe(testData);
    expect(encrypted).toContain(':'); // Format: iv:tag:encrypted

    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(testData);
  });

  test('should produce different ciphertext for same input', () => {
    const encrypted1 = encrypt(testData, secret);
    const encrypted2 = encrypt(testData, secret);
    
    // Different IVs should produce different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same value
    expect(decrypt(encrypted1, secret)).toBe(testData);
    expect(decrypt(encrypted2, secret)).toBe(testData);
  });

  test('should throw error for invalid encrypted data format', () => {
    expect(() => {
      decrypt('invalid-format', secret);
    }).toThrow('Invalid encrypted data format');
  });

  test('should throw error for wrong secret', () => {
    const encrypted = encrypt(testData, secret);
    const wrongSecret = 'wrong-secret-key';
    
    expect(() => {
      decrypt(encrypted, wrongSecret);
    }).toThrow();
  });
});
