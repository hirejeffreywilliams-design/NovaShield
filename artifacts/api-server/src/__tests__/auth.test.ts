import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock the db module to prevent DATABASE_URL requirement
vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
  },
}));

vi.mock("@workspace/db/schema", () => ({
  usersTable: {},
  sessionsTable: {},
}));

beforeAll(() => {
  process.env["JWT_SECRET"] = "test-jwt-secret-for-testing-only-32chars!";
  process.env["JWT_REFRESH_SECRET"] = "test-refresh-secret-for-testing-only-32chars!";
});

describe("Password hashing", () => {
  it("should hash a password with bcrypt", async () => {
    const { hashPassword } = await import("../lib/auth");
    const hash = await hashPassword("TestPassword123!");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("TestPassword123!");
    expect(hash.startsWith("$2b$12$")).toBe(true);
  });

  it("should verify a correct password", async () => {
    const { hashPassword, verifyPassword } = await import("../lib/auth");
    const hash = await hashPassword("CorrectPassword!");
    const valid = await verifyPassword("CorrectPassword!", hash);
    expect(valid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const { hashPassword, verifyPassword } = await import("../lib/auth");
    const hash = await hashPassword("CorrectPassword!");
    const valid = await verifyPassword("WrongPassword!", hash);
    expect(valid).toBe(false);
  });
});

describe("JWT tokens", () => {
  it("should generate and verify an access token", async () => {
    const { generateAccessToken, verifyAccessToken } = await import("../lib/auth");
    const payload = { userId: "test-user-id", email: "test@example.com", role: "reporter" as const };
    const token = generateAccessToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("should generate and verify a refresh token", async () => {
    const { generateRefreshToken, verifyRefreshToken } = await import("../lib/auth");
    const payload = { userId: "test-user-id", email: "test@example.com", role: "reporter" as const };
    const token = generateRefreshToken(payload);
    expect(token).toBeDefined();

    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it("should fail to verify an invalid token", async () => {
    const { verifyAccessToken } = await import("../lib/auth");
    expect(() => verifyAccessToken("invalid-token")).toThrow();
  });

  it("should not verify access token with refresh secret", async () => {
    const { generateAccessToken, verifyRefreshToken } = await import("../lib/auth");
    const payload = { userId: "test", email: "t@e.c", role: "reporter" as const };
    const accessToken = generateAccessToken(payload);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});

describe("Token hashing", () => {
  it("should produce consistent SHA-256 hashes", async () => {
    const { hashToken } = await import("../lib/auth");
    const hash1 = hashToken("test-token");
    const hash2 = hashToken("test-token");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it("should produce different hashes for different tokens", async () => {
    const { hashToken } = await import("../lib/auth");
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");
    expect(hash1).not.toBe(hash2);
  });
});
