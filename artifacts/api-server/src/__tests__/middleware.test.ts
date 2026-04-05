import { describe, it, expect, beforeAll, vi } from "vitest";

// Mock the db module
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

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe("Auth middleware", () => {
  it("should reject requests without auth header", async () => {
    const { authenticate } = await import("../middlewares/auth");
    const req = { headers: {}, user: undefined } as any;
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Authentication required");
    expect(next).not.toHaveBeenCalled();
  });

  it("should reject requests with invalid token", async () => {
    const { authenticate } = await import("../middlewares/auth");
    const req = { headers: { authorization: "Bearer invalid-token" }, user: undefined } as any;
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
    expect(next).not.toHaveBeenCalled();
  });

  it("should accept requests with valid token", async () => {
    const { authenticate } = await import("../middlewares/auth");
    const { generateAccessToken } = await import("../lib/auth");
    const payload = { userId: "user-123", email: "test@example.com", role: "reporter" as const };
    const token = generateAccessToken(payload);
    const req = { headers: { authorization: `Bearer ${token}` }, user: undefined } as any;
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe("user-123");
    expect(req.user.role).toBe("reporter");
  });

  it("should enforce role requirements", async () => {
    const { requireRole } = await import("../middlewares/auth");
    const middleware = requireRole("admin");

    const req = { user: { userId: "u1", email: "a@b.c", role: "reporter" } } as any;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions");
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow users with correct role", async () => {
    const { requireRole } = await import("../middlewares/auth");
    const middleware = requireRole("admin", "auditor");

    const req = { user: { userId: "u1", email: "a@b.c", role: "admin" } } as any;
    const res = createMockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
