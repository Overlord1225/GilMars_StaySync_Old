import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => {
  const showcaseModule = command === "serve"
    ? "./src/pages/dev/ComponentsShowcase.tsx"
    : "./src/pages/dev/DevOnlyStub.tsx";

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { test: /node_modules\/react(?:\/|$)/, name: "react" },
              { test: /node_modules\/react-dom(?:\/|$)/, name: "react-dom" },
              { test: /node_modules\/@supabase\//, name: "supabase" },
              { test: /node_modules\/react-router(?:-dom)?\//, name: "router" },
            ],
          },
        },
      },
    },
    resolve: {
      alias: [
        {
          find: "@/pages/dev/ComponentsShowcase",
          replacement: fileURLToPath(new URL(showcaseModule, import.meta.url)),
        },
        {
          find: "@",
          replacement: fileURLToPath(new URL("./src", import.meta.url)),
        },
      ],
    },
  };
});
