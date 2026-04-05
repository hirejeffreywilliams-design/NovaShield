import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, encryptField, decryptField } from "../lib/encryption";

beforeAll(() => {
  // 32 bytes = 64 hex chars
  process.env["ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("AES-256 Encryption", () => {
  it("should encrypt and decrypt a string", () => {
    const plaintext = "Sensitive reporter identity information";
    const { encrypted, iv } = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(iv.length).toBe(32); // 16 bytes hex

    const decrypted = decrypt(encrypted, iv);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "Same data twice";
    const result1 = encrypt(plaintext);
    const result2 = encrypt(plaintext);

    expect(result1.encrypted).not.toBe(result2.encrypted);
    expect(result1.iv).not.toBe(result2.iv);

    // Both should decrypt to the same value
    expect(decrypt(result1.encrypted, result1.iv)).toBe(plaintext);
    expect(decrypt(result2.encrypted, result2.iv)).toBe(plaintext);
  });

  it("should fail to decrypt with wrong IV", () => {
    const { encrypted } = encrypt("test data");
    const wrongIv = "00000000000000000000000000000000";
    expect(() => decrypt(encrypted, wrongIv)).toThrow();
  });
});

describe("Field-level encryption", () => {
  it("should encrypt and decrypt a field value", () => {
    const value = "reporter@example.com";
    const stored = encryptField(value);

    expect(stored).toContain(":");
    expect(stored).not.toContain(value);

    const recovered = decryptField(stored);
    expect(recovered).toBe(value);
  });

  it("should handle special characters", () => {
    const value = '{"name":"John Doe","ssn":"123-45-6789"}';
    const stored = encryptField(value);
    const recovered = decryptField(stored);
    expect(recovered).toBe(value);
  });

  it("should handle empty string", () => {
    const stored = encryptField("");
    const recovered = decryptField(stored);
    expect(recovered).toBe("");
  });

  it("should throw on invalid format", () => {
    expect(() => decryptField("no-colon-here")).toThrow("Invalid encrypted field format");
  });
});
