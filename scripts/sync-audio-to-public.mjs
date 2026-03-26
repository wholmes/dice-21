#!/usr/bin/env node
/**
 * Copy WAVs from repo-root `audio/` into `public/audio/` so Vite dev + `vite build`
 * ship the same bytes. Vite only includes `public/` in the output — edits under
 * `audio/` alone do not affect the build.
 *
 * Run automatically via `prebuild` / `predev`, or: `npm run sync-audio`
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(root, 'audio')
const dstRoot = path.join(root, 'public', 'audio')

function copyWavsRecursive(rel = '') {
  const srcDir = path.join(srcRoot, rel)
  if (!fs.existsSync(srcDir)) return
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })
  for (const ent of entries) {
    const name = ent.name
    if (name.startsWith('.')) continue
    const src = path.join(srcDir, name)
    const sub = rel ? path.join(rel, name) : name
    if (ent.isDirectory()) {
      const dstSub = path.join(dstRoot, sub)
      fs.mkdirSync(dstSub, { recursive: true })
      copyWavsRecursive(sub)
      continue
    }
    if (!name.endsWith('.wav')) continue
    const dst = path.join(dstRoot, sub)
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    fs.copyFileSync(src, dst)
  }
}

copyWavsRecursive()
console.log('sync-audio: copied audio/*.wav → public/audio/')
