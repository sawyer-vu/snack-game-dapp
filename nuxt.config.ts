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

  app: {
    head: {
      title: "Snack Game DApp - Play & Earn on Hydra",
      htmlAttrs: {
        lang: "en",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Play Snack Game on Hydra. Compete with players worldwide, earn rewards, and climb the leaderboard in this exciting blockchain gaming experience.",
        },
        {
          name: "keywords",
          content:
            "Hydra game, blockchain gaming, play to earn, Hydra DApp, NFT game, crypto gaming, web3 game, Hydra rewards",
        },
        { name: "author", content: "Snack Game DApp" },
        { name: "theme-color", content: "#0033AD" },

        // Open Graph / Facebook
        { property: "og:type", content: "website" },
        {
          property: "og:url",
          content: "https://snackgame.io",
        },
        {
          property: "og:title",
          content: "Snack Game DApp - Play & Earn on Hydra",
        },
        {
          property: "og:description",
          content:
            "Play Snack Game on Hydra. Compete with players worldwide, earn rewards, and climb the leaderboard.",
        },
        {
          property: "og:image",
          content: "https://snackgame.io/og-image.jpg",
        },
        { property: "og:site_name", content: "Snack Game DApp" },

        // Twitter
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:url",
          content: "https://snackgame.io",
        },
        {
          name: "twitter:title",
          content: "Snack Game DApp - Play & Earn on Hydra",
        },
        {
          name: "twitter:description",
          content:
            "Play Snack Game on Hydra. Compete with players worldwide, earn rewards, and climb the leaderboard.",
        },
        {
          name: "twitter:image",
          content: "https://snackgame.io/twitter-image.jpg",
        },

        // Additional SEO
        { name: "robots", content: "index, follow" },
        { name: "googlebot", content: "index, follow" },
        { name: "format-detection", content: "telephone=no" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/favicon-96x96.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "canonical", href: "https://snackgame.io" },
      ],
    },
  },

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
      wssEndpoint:
        process.env.NUXT_PUBLIC_WSS_ENDPOINT || "ws://localhost:3000",
      httpsEndpoint:
        process.env.NUXT_PUBLIC_HTTPS_ENDPOINT || "http://localhost:3000",
      blockfrostApiKey: process.env.NUXT_PUBLIC_BLOCKFROST_API_KEY || "",
      scriptAddress: process.env.NUXT_PUBLIC_SCRIPT_ADDRESS || "",
      txScript: process.env.NUXT_PUBLIC_TX_SCRIPT || "",
      addressReward: process.env.NUXT_PUBLIC_ADDRESS_REWARD || "",
      privateKeyHexReward: process.env.NUXT_PUBLIC_PRIVATE_KEY_HEX_REWARD || "",
    },
  },
});
