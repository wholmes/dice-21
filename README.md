# Dice 21 & Poker Dice

Browser games built with [Vite](https://vitejs.dev/) as a small multi-page app: **Dice 21** is the default at `/` (also `/dice-21/`), and **Poker Dice** lives at `/poker-dice/`. Both can use an optional **Node WebSocket server** for two-player sessions.

## Requirements

- **Node.js** 18+ (for `npm` and native `fetch` / ES modules)

## Install

```bash
npm install
```

## Run locally (single-player / UI only)

Start the Vite dev server:

```bash
npm run dev
```

Then open:

| Game        | URL (typical) |
|------------|----------------|
| Dice 21    | `http://localhost:5173/` (same game at `/dice-21/`) |
| Poker Dice | `http://localhost:5173/poker-dice/` |

Vite prints the exact port if 5173 is taken.

## Multiplayer setup

Multiplayer is **not** served by Vite. It uses a separate process: `mp-server.mjs`, a small relay that speaks WebSocket on **port 8788** by default.

### 1. Start the WebSocket server

In one terminal:

```bash
npm run mp-server
```

You should see:

```text
mp-server listening on ws://localhost:8788
```

### 2. Start the web app

In another terminal:

```bash
npm run dev
```

Open Poker Dice or Dice 21 in the browser as above. The page loads static assets from Vite; the game connects to the multiplayer server at **`ws://<same-host>:8788`** (or `wss:` when the page is served over HTTPS).

### 3. Play together

- **Host** creates a room and gets a **4-character room code** (letters/digits, ambiguous characters like `0`/`O` are avoided).
- **Guest** joins with that code. The server pairs one host and one guest per room; a third player gets “room is full.”
- If the WebSocket server is not running, Dice 21 shows a warning such as “WebSocket error — is mp-server running?”

### Dice 21 multiplayer behavior

- **Host** plays the full Dice 21 game (deal, hit, stand, chips, etc.).
- **Guest** joins as a **spectator**: the HUD (totals, pot, chips, messages) **syncs live** from the host; guest controls are disabled so one person drives the match.

### Dice 21: progressive stakes (single-player)

Bet sizes unlock from **lifetime stats** stored in the browser (`localStorage`). You start at **$1** bets (pot up to **$2** with the house match). Larger chips appear only after you have played enough hands **and** won enough total dollars over your career (both thresholds apply).

| Max bet | Next pot (2× bet) | Hands played | Lifetime $ won |
|--------:|------------------:|-------------:|---------------:|
| $1 | $2 | — | — |
| $5 | $10 | ≥ 15 | ≥ $250 |
| $25 | $50 | ≥ 60 | ≥ $2,000 |
| $100 | $200 | ≥ 200 | ≥ $8,000 |

The bet dock shows progress toward the next tier. Clearing lifetime stats resets stake unlocks and returns the default bet to **$1**.

### Poker Dice

Uses the **same** `mp-server` process and protocol (room codes, host/guest, shared deterministic rolls via a match seed). Run `mp-server` alongside `npm run dev` the same way.

---

## Configuration

| Variable / detail | Meaning |
|-------------------|--------|
| **`PORT`**        | WebSocket listen port. Default **`8788`**. Example: `PORT=9000 npm run mp-server` |
| **Client URL**    | The browser builds the WebSocket URL as `ws(s)://<page hostname>:8788` — the port is fixed in the bundled client to **8788** unless you change the source in `public/assets/dice21-mp.js` (and the Poker Dice bundle) and rebuild. |

So: if you change the server port with `PORT`, you must either keep **8788** for the client or update the client and rebuild.

---

## Production and networking notes

- **HTTPS sites** use **`wss://`** to the same host on port **8788**. You need a TLS endpoint for that port (or a reverse proxy that upgrades WebSocket and forwards to `mp-server`).
- **Remote two players** must both reach **the same** WebSocket host/port (same LAN, or a server with **8788** open / proxied). Playing “host on laptop, guest on phone” on the same Wi‑Fi usually means using the computer’s LAN IP in the phone’s browser (e.g. `http://192.168.x.x:5173/` or `/dice-21/`) and ensuring nothing blocks **8788** on the machine running `mp-server`.
- **`mp-server` is in-memory**: restarting it clears rooms and sessions. There is no persistence layer.

## Build (static output)

```bash
npm run build
```

Output goes to `dist/`. Serve `dist/` with any static host; **multiplayer still requires** `mp-server` (or equivalent) reachable at the host/port the client expects.

## Scripts

| Script        | Purpose |
|---------------|---------|
| `npm run dev` | Vite dev server (games + HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run mp-server` | WebSocket multiplayer relay (`mp-server.mjs`) |

## Repository

Source: [github.com/wholmes/dice-21](https://github.com/wholmes/dice-21)
