import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "vmThreads",
    isolate: true,
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});