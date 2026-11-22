import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "supabase", test: /node_modules[\/]@supabase[\/]/ },
            {
              name: "react",
              test: /node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/,
            },
            // Charts are used only by a lazy admin route, so they stay out of
            // every group and ship with that route's own chunk.
            {
              name: "vendor",
              test: /node_modules[\/](?!(recharts|d3-[^\/]+|victory-vendor|decimal\.js-light|es-toolkit|immer|reselect|redux|@reduxjs)[\/])/,
            },
          ],
        },
      },
    },
  },
});
