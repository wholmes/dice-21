# Deploying Dice 21 / Poker Dice (static build)

This repo is a **Vite** multi-page app. Production output is the **`dist/`** folder (not committed to git). **Always run a build after pulling** before publishing static files.

---

## Build commands (which one to use)

| Command | Vite `base` | Use when the game is served at… |
|--------|-------------|----------------------------------|
| **`npm run build`** | **`/dice-21/`** (default) | `https://<user>.github.io/dice-21/` — i.e. this **repository** as a GitHub Pages **project site** (repo name `dice-21`, files from `dist/` at the site root). |
| **`npm run build:arcade`** | **`/arcade/`** | `https://<user>.github.io/arcade/dice-21/` — nested under an **`arcade`** path (e.g. monorepo or org site where Dice 21 lives under **`arcade/dice-21/`**). |
| **`npm run build:static`** | **`./`** (relative) | Local testing only: `cd dist && python3 -m http.server` — relative URLs like `../assets/...` match the folder layout. **Do not** use this output for GitHub’s default `/dice-21/` or `/arcade/` URLs unless your host rewrites paths. |
| **`BASE_PATH=/custom/ npm run build`** | whatever you set | Any other fixed path prefix your host uses (must start and end with `/`). |

**`npm run build`** and **`npm run build:arcade`** both:

1. Run **`npm run dj:manifest`** (DJ playlist manifest for `public/audio/dj/`).
2. Run **`vite build`**.
3. Run **`node scripts/patch-dice21-entry.mjs`** (see below).

---

## Why `base` matters (404s on scripts)

Vite injects **absolute** script URLs into HTML, e.g. **`/dice-21/assets/dice21-DU7nhPGz.js`** or **`/arcade/assets/...`**.

The browser resolves those from the **hostname root** (`github.io`), not from the folder you opened on disk:

- Wrong base → requests like **`https://wholmes.github.io/dice-21/assets/...`** while the site is actually under **`https://wholmes.github.io/arcade/...`** → **404**, nothing loads, **Tap to play** stays disabled.
- Match **`base`** to the **first path segment(s)** where **`dist/`** is mounted on the live site.

**Examples:**

| Live URL | Build command |
|----------|----------------|
| `https://wholmes.github.io/dice-21/dice-21/` | `npm run build` (default `/dice-21/`) |
| `https://wholmes.github.io/arcade/dice-21/` | `npm run build:arcade` (`/arcade/`) |

After changing **`vite.config.js`** or **`BASE_PATH`**, **rebuild** before uploading **`dist/`**.

---

## Post-build patch (`scripts/patch-dice21-entry.mjs`)

The Dice 21 **entry chunk** (`dice21-DU7nhPGz.js`) is generated with a small helper that **module-preloads** dependency paths as **`/assets/...`** (missing the Vite **`base`** prefix). On GitHub Pages that can **404** and block loading **`main-BosaNfoM.js`**, so **`window.d21EnterGame`** never exists and the **Tap to play** button never enables.

The patch script rewrites that wrapper to a plain **`import("./main-BosaNfoM.js")`**, which resolves correctly next to the entry script under **`/dice-21/assets/`** or **`/arcade/assets/`**.

It is run automatically at the end of **`npm run build`** and **`npm run build:arcade`** (and **`build:static`**). If you run **`vite build`** by hand, run **`node scripts/patch-dice21-entry.mjs`** afterward, or use the npm scripts above.

---

## Tap to play (start gate)

The game waits for **`window.d21EnterGame()`** (defined in the main bundle) before starting the render loop and audio. **`public/assets/dice21-start-gate.js`** preloads some audio, then enables **Tap to play** and calls **`d21EnterGame()`** on click.

If scripts fail to load (404) or the patch did not run, the button can stay on **Loading…** or stay disabled.

---

## Publishing to GitHub Pages (typical)

1. Choose the build command that matches your **live URL** (see table above).
2. Run **`npm install`** (once) then **`npm run build`** or **`npm run build:arcade`**.
3. Upload **everything inside** **`dist/`** to the branch/folder your Pages site uses (often **`gh-pages`** or **`docs/`** on **`main`**).
4. Hard-refresh the site (**Cmd+Shift+R** / **Ctrl+Shift+R**) after deploy.

**Audio / public files:** Anything under **`public/`** (e.g. **`audio/`**) is copied into **`dist/`**. Preload URLs from the start gate resolve with **`../`** from the **`dice-21/`** page so **`audio/`** and **`assets/`** siblings stay correct for **`/dice-21/`** and **`/arcade/`** layouts.

---

## Local checks

| Goal | Command |
|------|---------|
| Dev server | `npm run dev` — **`base`** is **`/`**; open **`/dice-21/`**. |
| Preview last production build | `npm run preview` — respects the **`base`** from the **last** `vite build`. |
| Preview **arcade** build | `npm run build:arcade` then `BASE_PATH=/arcade/ npx vite preview` (or use **`npm run preview:arcade`** if configured). |

---

## `file://` and the file gate

Opening built HTML via **`file://`** is unsupported for ES modules. The page includes **`#fileGate`** explaining to use a local HTTP server; use **`npm run preview`** or **`cd dist && python3 -m http.server`**.

---

## Quick reference — environment variable

Override the default production base without editing **`vite.config.js`**:

```bash
BASE_PATH=/your/prefix/ npm run build && node scripts/patch-dice21-entry.mjs
```

(`npm run build` already runs the patch; only add the patch line if you invoked **`vite build`** alone.)

Default when **`BASE_PATH`** is unset: **`/dice-21/`** (see **`vite.config.js`**).
