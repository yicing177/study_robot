import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // 確保引入 path

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 設定 @ 指向 src
    },
  },
  define: {
    global: {},
  },
  server: {
    proxy: {
      "/gpt": { target: "http://localhost:5000", changeOrigin: true },
      "/routes": { target: "http://localhost:5000", changeOrigin: true },
      "/material": { target: "http://localhost:5000", changeOrigin: true },
      "/calendar": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});


