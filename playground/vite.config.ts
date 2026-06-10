import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@01.works/branding/react": path.resolve(rootDir, "../src/react.tsx"),
      "@01.works/branding": path.resolve(rootDir, "../src/index.ts"),
    },
  },
});
