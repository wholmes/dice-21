/**
 * Vite's dice21 entry chunk wraps the main bundle in a helper that preloads
 * `/assets/...` (missing `base`), which 404s on GitHub Pages. Replace with a
 * plain dynamic import so `window.d21EnterGame` loads and Tap to play works.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
import fs from 'node:fs'
import path from 'node:path'

const distAssets = path.resolve('dist', 'assets')
const needle = 'await v(()=>import("./main-dice21-core.js"),__vite__mapDeps([0,1]))'
const repl = 'await import("./main-dice21-core.js?v=lt2")'

let ok = false
if (fs.existsSync(distAssets)) {
  for (const name of fs.readdirSync(distAssets)) {
    if (!name.includes('dice21-DU7nhPGz') || !name.endsWith('.js')) continue
    const file = path.join(distAssets, name)
    let code = fs.readFileSync(file, 'utf8')
    if (!code.includes(needle)) continue
    code = code.replace(needle, repl)
    fs.writeFileSync(file, code)
    console.log('patch-dice21-entry: updated', file)
    ok = true
    break
  }
}
if (!ok) {
  console.warn('patch-dice21-entry: no matching chunk found (needle may have changed)')
  process.exitCode = 0
}
