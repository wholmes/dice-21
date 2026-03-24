# Dice 21 & Poker Dice

Two browser games in one [Vite](https://vitejs.dev/) multi-page app: **Dice 21** is the home page (`/` and `/dice-21/`), and **Poker Dice** lives at `/poker-dice/`. Both can use an optional **Node WebSocket server** for online two-player sessions.

---

## Dice 21 — how to play

**Goal:** Get closer to **21** than the house without going **over** (busting). You play against the dealer, not other seats.

### One round

1. **Pick a chip** ($1, $5, $25, or $100 depending on what you’ve unlocked) and press **Bet** (or the main bet control). You and the house each put that amount in; the **pot** is both antes combined (so a $5 bet ⇒ $10 in the pot before cards/dice).
2. You get a **two-dice roll** to start. Your total shows in the panel.
3. **Hit** to roll more dice, or **Stand** to lock your total and send play to the house.
4. **Hitting:** If your total is **under 14**, your next hit uses **two dice** at once. At **14 or more**, each hit is **one die** only—so high totals get riskier.
5. The **house** then rolls automatically until it stands or busts, following the **dealer mode** you chose (see below).
6. **Compare:** Higher total without busting wins the pot. Tie = **push** (see below).

### Winning, losing, and pushes

- **You win:** You take the pot (and sometimes extras—see Fortune mode).
- **You lose:** The house takes the pot.
- **Push (tie):** On a tie, you get a **small refund** from the house (based on your bet size), not the full pot—so ties aren’t a complete wash.

### After you win — double or nothing

When you win a pot, you may get **Double or nothing?**: risk that win on a single **your die vs house die** roll (higher wins; ties re-roll). You can **Take win** to skip the gamble.

### Rolling the dice

Rolls use a **3D table** view. While dice are “shaking,” you can **hold Space / Enter** (or press and hold the on-screen card) for a longer shake, or release early—optional flair; the game resolves when the shake finishes.

### Badges & lifetime stats

The panel tracks **lifetime** net, won, lost, and hands played. **Badges** unlock from milestones (first win, streaks, pushes, high pots, etc.). Stats are stored in the browser (`localStorage`) unless you reset.

---

## Dice 21 — dealer modes (rules)

These only change **how the house plays** after you stand—not your hit rules.

| Mode | Dealer behavior |
|------|-----------------|
| **Classic** | House hits on totals **below 17**, stands on **17+** (standard feel). |
| **Sharp** | House hits up to **18** (slightly tougher dealer). |
| **Chill** | House **stands on 16** (a bit softer). |
| **Fortune** | Same dealer idea as Classic for hits/stands, but when **you win with exactly 21**, you get an **extra half-bet** payout on top of the pot. |

Changing mode asks for **confirmation** first (dealer rules and Fortune payouts change; your chip stacks are not wiped). You can’t change mode mid-roll, mid-hand, or while **double-or-nothing** is open.

---

## Dice 21 — progressive stakes & bankroll

- **Starting position:** Everyone begins at **$1** max bet (pot up to **$2** with the match). Your **table bankroll** scales with tier: **100× your max bet** (e.g. $100 bank each side at $1 stakes, up to **$10,000** each at $100 stakes).
- **Unlocking bigger chips** needs both **enough lifetime hands played** and **enough lifetime dollars won** (career total, not one session):

| Max bet | Typical pot (2× bet) | Hands (lifetime) | $ won (lifetime) |
|--------:|----------------------:|-----------------:|-----------------:|
| $1 | $2 | — | — |
| $5 | $10 | ≥ 15 | ≥ $250 |
| $25 | $50 | ≥ 60 | ≥ $2,000 |
| $100 | $200 | ≥ 200 | ≥ $8,000 |

The UI shows progress toward the **next** tier. When you unlock a tier, you get a **stakes-up** celebration and the **table theme** updates (see below).

---

## Dice 21 — table look (stake tier)

The **felt color**, scene lighting, and the **logo** painted on the felt match your **current max stake tier**—the table “levels up” with your career.

| Tier | Table vibe | Logo flavor |
|------|------------|-------------|
| **$1** | Classic emerald | “21” + DICE 21 |
| **$5** | Club | “CLUB” line |
| **$25** | Premium | “PREMIUM” |
| **$100** | Elite / high-stakes | “HIGH STAKES”, “MAX $100 · DICE 21”, gold treatment |

Tier applies on load, when you unlock a new tier, and after **Reset all progress** (back to $1 look). There is no separate felt color picker in the UI anymore—felt follows progression.

---

## Dice 21 — reset progress

**Reset all progress** (Lifetime section) clears for this browser:

- Lifetime stats, badges, stake tier (back to $1 max bet)
- Current hand, pot, chips on the table
- Table felt/logo (back to **$1** tier)

It does **not** clear your chosen **dealer mode** (`dice21_mode_v1` in `localStorage`). For a full wipe of prefs, clear site data or use a private window.

---

## Requirements & run locally

- **Node.js** 18+

```bash
npm install
npm run dev
```

Vite prints the URL (often `http://localhost:5173/`; the port changes if that one is busy). Open **`/`** or **`/dice-21/`** for Dice 21, **`/poker-dice/`** for Poker Dice.

---

## Multiplayer (WebSocket)

Multiplayer is **not** the Vite dev server. Run the relay:

```bash
npm run mp-server
```

Default **`ws://localhost:8788`**. In another terminal, `npm run dev` and open the game; the client connects to the **same host** on port **8788** (or `wss:` on HTTPS).

- **Host** creates a room and shares a **4-character code** (ambiguous chars like `0`/`O` avoided).
- **Guest** joins with the code; a third player gets “room full.”
- **Dice 21:** Host plays the full game; **guest spectates** with a live HUD sync (guest controls disabled).
- **Poker Dice:** Same server and room flow; shared deterministic rolls from a match seed.

If `mp-server` isn’t running, Dice 21 can show a WebSocket error in the multiplayer panel.

---

## Configuration (multiplayer)

| Detail | Meaning |
|--------|--------|
| **`PORT`** | WebSocket listen port. Default **`8788`**. Example: `PORT=9000 npm run mp-server` |
| **Client** | Bundled clients assume **8788** unless you change `public/assets/dice21-mp.js` (and Poker Dice’s bundle) and rebuild. |

If you change the server port, either keep **8788** or update the client to match.

---

## Production & networking

- **`wss://`** on HTTPS needs TLS on that port or a reverse proxy that upgrades WebSockets to `mp-server`.
- Remote play: both browsers must reach the **same** WS host/port (LAN IP, or a server with **8788** open/proxied).
- **`mp-server` is in-memory**—restarting clears rooms; no DB.

---

## Build

```bash
npm run build
```

Output: `dist/`. Serve it as static files; multiplayer still needs `mp-server` (or equivalent) where the client expects it.

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run mp-server` | WebSocket relay (`mp-server.mjs`) |

---

## Development notes (Dice 21 bundle)

- Game logic and 3D live in the Dice 21 **main chunk** under `public/assets/` (hashed name in some builds, e.g. `main-BosaNfoM.js`; the entry script `dice21-*.js` imports it).
- **`?previewStakes=1|5|25|100`** on `/dice-21/` forces a **visual tier preview** for art/layout (does not write lifetime stats). Omit the query to use real progression. Dev: `window.__d21Dev.previewStakesUp(n)` does the same in-session.
- Lifetime counters are initialized at **module top** so tier logic is safe when the logo mesh is created at startup (avoids temporal-dead-zone issues with `lsH` / `lsW`).

---

## Repository

Source: [github.com/wholmes/dice-21](https://github.com/wholmes/dice-21)
