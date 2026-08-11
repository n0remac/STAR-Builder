import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: ["./tests/integration/global-setup.ts"],
    globals: true,
    include: ["tests/integration/**/*.integration.test.ts"],
    maxWorkers: 1
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "server-only": new URL(
        "./tests/integration/server-only.ts",
        import.meta.url
      ).pathname
    }
  }
});
