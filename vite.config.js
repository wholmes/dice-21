/**
 * Dice 21 / Poker Dice — Vite multi-page config.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Multi-page: `/` redirects to Dice 21; `poker-dice/` = Poker Dice.
 * Prebuilt bundles live under `public/assets/` (served at `/assets/...`).
 *
 * GitHub Pages project URL is `https://<user>.github.io/<repo>/`, so production
 * builds must use base `/dice-21/` or scripts load from the site root and 404.
 *
 * Production build output goes to `docs/` so you can enable Pages: Deploy from
 * branch main → /docs without Actions artifact deploy (commit `docs/` after build).
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/dice-21/' : '/',
  root,
  publicDir: 'public',
  appType: 'mpa',
  build: {
    outDir: 'docs',
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        dice21: resolve(root, 'dice-21/index.html'),
        poker: resolve(root, 'poker-dice/index.html'),
      },
    },
  },
}))
