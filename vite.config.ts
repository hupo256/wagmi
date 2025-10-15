import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // 路径别名配置
  resolve: {
    alias: {
      "@": "/src",
      "@abis": "/src/abis",
      "@components": "/src/components",
      "@common": "/src/common",
      "@contracts": "/src/contracts",
      "@pages": "/src/pages",
    },
  },
});
