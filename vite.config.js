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
 * If BASE_PATH is unset, defaults to `/dice-21/` for repo `dice-21` at
 * `https://<user>.github.io/dice-21/`. For a nested site such as
 * `https://<user>.github.io/arcade/dice-21/`, build with `npm run build:arcade`
 * (BASE_PATH `/arcade/`). For a plain folder test, use `npm run build:static`.
 */
const productionBase =
  process.env.BASE_PATH !== undefined && process.env.BASE_PATH !== ''
    ? process.env.BASE_PATH
    : '/dice-21/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? productionBase : '/',
  root,
  publicDir: 'public',
  appType: 'mpa',
  build: {
    modulePreload: false,
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
