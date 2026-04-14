import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // @imgly/background-removal uses WebWorkers + WASM — exclude from pre-bundling
    exclude: ["@imgly/background-removal"],
  },
});