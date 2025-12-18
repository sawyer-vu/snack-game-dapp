import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineNuxtConfig({
  modules: ["@nuxt/icon", "@pinia/nuxt", "@vueuse/nuxt"],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/tailwind.css"],
  ssr: false,

  vite: {
    plugins: [
      tailwindcss(),
      wasm(),
      topLevelAwait(),
      nodePolyfills({
        // Specific modules that should not be polyfilled.
        exclude: [],
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true, // can also be 'build', 'dev', or false
          global: false,
          process: false,
        },
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
    ],
  },

  pinia: {
    storesDirs: ["./stores/**"],
  },

  runtimeConfig: {
    public: {
      ogmiosEndpoint: process.env.NUXT_OGMIOS_ENDPOINT || "",
    },
  },
});