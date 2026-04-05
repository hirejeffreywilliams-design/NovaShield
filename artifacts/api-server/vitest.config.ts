import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      JWT_SECRET: "test-jwt-secret-for-testing-only-32chars!",
      JWT_REFRESH_SECRET: "test-refresh-secret-for-testing-only-32chars!",
      ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    },
    include: ["src/__tests__/**/*.test.ts"],
  },
});
