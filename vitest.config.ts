import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      PORT: "3334",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-must-be-long-enough-32chars",
      RESEND_API_KEY: "re_test_key_123",
      RESEND_FROM_EMAIL: "noreply@fiorote.com",
      FRONTEND_URL: "http://localhost:3000",
      APP_URL: "http://localhost:3334",
      MERCADO_PAGO_ACCESS_TOKEN: "APP_USR-test-access-token-fake",
      MERCADO_PAGO_WEBHOOK_SECRET: "test-webhook-secret",
      GOOGLE_CLIENT_ID: "test-google-client-id.apps.googleusercontent.com",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/tests/**",
        "src/server.ts",
        "src/@types/**",
        "src/env/index.ts",
      ],
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 55,
      },
    },
    testTimeout: 15000,
    hookTimeout: 15000,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
