/**
 * Dice 21 — generate `public/audio/dj/manifest.json` from folder contents.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
import { readdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const djDir = join(__dirname, '..', 'public', 'audio', 'dj')
const files = (await readdir(djDir).catch(() => []))
  .filter((f) => f.toLowerCase().endsWith('.wav'))
  .sort((a, b) => a.localeCompare(b))
const out = join(djDir, 'manifest.json')
await writeFile(out, JSON.stringify({ files }, null, 2) + '\n', 'utf8')
console.log(`DJ manifest: ${files.length} wav file(s) -> ${out}`)
