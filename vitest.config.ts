import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "playwright"],
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "a".repeat(32),
      B2_S3_ENDPOINT: "https://s3.us-west-001.backblazeb2.com",
      B2_KEY_ID: "test-key-id",
      B2_APPLICATION_KEY: "test-application-key",
      B2_BUCKET_NAME: "testbucket",
    },
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["lib/**", "components/**", "hooks/**", "app/api/**"],
      exclude: ["**/*.d.ts", "node_modules"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
