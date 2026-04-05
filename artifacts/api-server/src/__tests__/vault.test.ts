import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt } from "../lib/encryption";

beforeAll(() => {
  process.env["ENCRYPTION_KEY"] = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
});

describe("Whistleblower Vault encryption", () => {
  it("should encrypt evidence data end-to-end", () => {
    const evidence = JSON.stringify({
      type: "document",
      content: "Confidential whistleblower information about department corruption",
      timestamp: new Date().toISOString(),
    });

    const { encrypted, iv } = encrypt(evidence);

    // Encrypted data should not contain the original content
    expect(encrypted).not.toContain("Confidential");
    expect(encrypted).not.toContain("whistleblower");
    expect(encrypted).not.toContain("corruption");

    // Should decrypt back to original
    const decrypted = decrypt(encrypted, iv);
    const parsed = JSON.parse(decrypted);
    expect(parsed.type).toBe("document");
    expect(parsed.content).toContain("whistleblower");
  });

  it("should handle large evidence payloads", () => {
    const largeData = "x".repeat(100000); // 100KB
    const { encrypted, iv } = encrypt(largeData);
    const decrypted = decrypt(encrypted, iv);
    expect(decrypted).toBe(largeData);
  });

  it("should handle unicode in evidence", () => {
    const unicodeData = "Evidence with unicode: 日本語テスト, emojis 🚔🔒, accents café";
    const { encrypted, iv } = encrypt(unicodeData);
    const decrypted = decrypt(encrypted, iv);
    expect(decrypted).toBe(unicodeData);
  });
});
