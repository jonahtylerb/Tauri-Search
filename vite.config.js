import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import extractorSvelte from "@unocss/extractor-svelte";
import unocss from "unocss/vite";
import { presetUno, presetAttributify } from "unocss";
import { presetHeroPatterns } from "@julr/unocss-preset-heropatterns";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    unocss({
      presets: [
        presetUno(),
        presetAttributify({
          prefix: "data-",
        }),
        presetHeroPatterns(),
      ],
      extractors: [extractorSvelte()],
    }),
    sveltekit(),
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
