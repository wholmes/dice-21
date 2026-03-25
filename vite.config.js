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
 */
export default defineConfig({
  root,
  publicDir: 'public',
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        dice21: resolve(root, 'dice-21/index.html'),
        poker: resolve(root, 'poker-dice/index.html'),
      },
    },
  },
})
