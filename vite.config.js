import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/quantum-tunnel/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        nested: resolve(__dirname, "debug.html"),
      },
    },
  },
});
