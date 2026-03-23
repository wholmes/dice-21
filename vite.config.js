import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Multi-page dev: root `index.html` = Poker Dice; `dice-21/index.html` = Dice 21.
 * Prebuilt bundles live under `public/assets/` (served at `/assets/...`).
 */
export default defineConfig({
  root,
  publicDir: 'public',
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        dice21: resolve(root, 'dice-21/index.html'),
      },
    },
  },
})
