import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    isolate: true,
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});