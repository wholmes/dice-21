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
 * Production `base` must match where the site is hosted (GitHub Pages project
 * sites live under `https://<user>.github.io/<repo>/`). Set when building:
 *   BASE_PATH=/your-static-repo-name/ npm run build
 * Use `/` only if the site is served at the domain root (e.g. custom domain).
 * If BASE_PATH is unset, defaults to `./` (relative) so `dist/` works with any
 * static server (e.g. `python -m http.server`) and asset URLs resolve to
 * `../assets/...` from `dice-21/index.html`. Use `BASE_PATH=/dice-21/` if you
 * must emit absolute `/dice-21/...` URLs for a specific host.
 */
const productionBase =
  process.env.BASE_PATH !== undefined && process.env.BASE_PATH !== ''
    ? process.env.BASE_PATH
    : './'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? productionBase : '/',
  root,
  publicDir: 'public',
  appType: 'mpa',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        dice21: resolve(root, 'dice-21/index.html'),
        poker: resolve(root, 'poker-dice/index.html'),
      },
    },
  },
}))
