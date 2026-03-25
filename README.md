# Dice 21 & Poker Dice

Two browser games in one [Vite](https://vitejs.dev/) multi-page app: **Dice 21** is the home page (`/` and `/dice-21/`), and **Poker Dice** lives at `/poker-dice/`. Both can use an optional **Node WebSocket server** for online two-player sessions.

**Deploy / GitHub Pages / `BASE_PATH`:** see **[DEPLOY.md](./DEPLOY.md)**.

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

Rolls use a **3D table** view. When the table loads, two idle dice **drop** onto the felt (**~0.5 s** ease) and **tumble** into a proper face-up rest (aligned with the die mesh’s table height) before you place a bet. On the **first roll** after that, the **shake** phase begins as usual (no second drop). In the **shake** phase, the dice **only** wobble while you **hold** **Space / Enter** or **press and hold** the on-screen card; **release** to start the roll (or keep holding until the max shake time). If you **don’t** use those controls, the game **starts the roll almost immediately** (**~0.1 s**) so you aren’t stuck on frozen dice—**optional** shake is only when **you** trigger it. While the dice **roll** in 3D, the **shake hint** overlay can stay up (if enabled under Table) so players see that hold-to-shake is optional. **Reduced-motion** mode skips the intro drop and shake path.

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

## Dice 21 — audio assets (public/audio)

All gameplay SFX are **pre-decoded** with the Web Audio API ( **`AudioBufferSourceNode`**, not `<audio>` elements) and loaded from **`/audio/<basename>.wav`**. Keep sources as **16-bit PCM WAV** (e.g. **44.1 kHz or 48 kHz**) unless noted. **Trim leading silence** on impacts so transients line up with the animation—browsers cannot schedule audio earlier than `AudioContext.currentTime`.

**Preload:** The main bundle fetches and decodes assets at startup. Shake and dice impacts are prioritized; heavier clips (chip pushes, ambience, etc.) are kicked off on the next task so decode work does not all pile up at once. The first **`pointerdown`** (and returning to the tab) helps **`AudioContext.resume()`** on strict browsers.

### Dice impact (roll landing)

| File | When it plays |
|------|----------------|
| **`freesound_community-dry-dices-38579.wav`** | Rolls that use **two** dice (opening roll and hits while your total is **under 14**). |
| **`freesound_community-dry-dices-solo-38579.wav`** | Rolls that use **one** die (hits at **14+**, and **double-or-nothing**). |

**Timing:** Impacts are triggered from the **same roll animation** as the 3D dice. Default scheduling (no URL flags) biases **early** in the roll; use **`?diceSfxMs=0`** for a more **neutral** land relative to the roll timeline, and **`diceSfxHitAt`** to tune when the clack fires if `diceSfxMs` is non-negative. See the [URL parameters](#dice-21--url-query-parameters) table.

### Hold-to-shake loop

| File | When it plays |
|------|----------------|
| **`freesound_community-dice-shake-102631.wav`** | Looped **while** you hold **Space / Enter** or the on-screen shake control during the shake phase; stops when the roll starts or on reset. |

Use **WAV** for this clip so you avoid MP3 encoder delay in the decoded buffer. Optional URL tuning: **`diceShakeSfxMs`**, **`diceShakeSfxOffsetMs`** (skip milliseconds from the start of the buffer if the file has silence). The **shake motion** is ramped from **when you start holding**, with a small delay tied to **`AudioContext.outputLatency`** where available, so visuals and audio stay closer together than a pure “phase time since dice landed” ramp.

### Pot chip stack (center pot grows)

When the **visible center stack** gains chips, one shot is chosen from:

| File | When it plays |
|------|----------------|
| **`freesound_community-allinpushchips2-39133.wav`** | Smaller stacks (below the “big pile” threshold). |
| **`freesound_community-allinpushchips-96121.wav`** | **Large** stacks—default when stack count **≥ 12** (override with **`chipPushBigMin`**). |

### Room ambience & music (DJ)

**Room ambience** is **`freesound_community-casino-ambiance-19130.wav`** (`ambRoom`): one looped casino bed when **Room ambience** is on. **Ambience DJ** is a **playlist** of one-shots—**silk** then **lush**, then repeat—layered on top when **Ambience DJ** is on (independent buffers from the room track).

| File | Role |
|------|------|
| **`freesound_community-casino-ambiance-19130.wav`** | **Room ambience** only (looped; optional Table dock **Room ambience**). |
| **`silk-icosphere-main-version-15772-01-30.wav`** | **Ambience DJ** playlist (first slot). |
| **`lush-21-on-the-block-main-version-43576-01-53.wav`** | **Ambience DJ** playlist (second slot). |

**Room ambience** is **on by default** (`dice21_room_amb` in `localStorage`, or **`?roomAmbience=1`**). Turn it off for DJ-only or silence.

**Ambience DJ** is **on by default** (checkbox in the Table dock, **`?djAmbience=1`**, or `dice21_amb_dj`). Turn it off to hear only the room bed (if **Room ambience** is on).

**Reduced motion** (`prefers-reduced-motion` or **`?reducedMotion=1`**) disables ambience and most other SFX.

### Feedback (deal / win)

| File | When it plays |
|------|----------------|
| **`freesound_community-cash-register-purchase-87313.wav`** | **Payout:** when you **collect** (win the pot, **push pay** on a tie, or **win** double-or-nothing). |
| **`freesound_community-player-wins-94889.wav`** | **You win** the hand, or **win** double-or-nothing. |

---

## Dice 21 — URL query parameters

Query parameters are read from **`/dice-21/`** (and the same path on your dev host). Combine them with **`&`** — order does not matter.

**Important:** The home redirect **`/` → `/dice-21/`** does **not** keep the query string. Always use **`/dice-21/?…`** when testing overrides.

### All parameters

| Parameter | Values | Read by | Effect |
|-----------|--------|---------|--------|
| **`previewStakes`** | `1`, `5`, `25`, `100`, or **empty** | Main game bundle | **Preview tier** for this load only: max bet, bankroll, felt, logo, chip cap, stake hint. Does **not** change lifetime stats in `localStorage`. Invalid number → **`5`**. Empty → **`5`**. |
| **`mode`** | `classic`, `sharp`, `chill`, `fortune` | Main bundle | Starting **dealer mode** for this load. Overrides `localStorage` `dice21_mode_v1` until you change mode in the UI (then the UI saves as usual). |
| **`shakeHint`** | `0` or `1` | Main bundle | **`1`** = show shake overlay hints; **`0`** = hide. Overrides the saved `dice21_shake_hint_overlay` preference for this session until you toggle the checkbox. |
| **`reducedMotion`** | `1` or `true` | Main bundle | Forces **reduced-motion** behavior (simpler rolls, no shake overlay path, etc.) as if `prefers-reduced-motion: reduce` were on. |
| **`diceSfxMs`** | `-40000`–`2000` (ms) | Main bundle | **Signed** offset for **dice impact** timing (see **[Audio assets](#dice-21--audio-assets-publicaudio)**). **Omitted** = baked default (early in the roll). **`0`** = use **`diceSfxHitAt`** / completion path without the large negative “early” bias. **Positive** = extra delay (seconds capped). **Large negative** values clamp (see bundle) so scheduling stays in range. |
| **`diceSfxHitAt`** | `0.5`–`1` | Main bundle | Fraction of roll progress **`n`** when the **first** impact may fire if **`diceSfxMs` ≥ 0** path applies. Default **`1`** = only with roll completion. Lower (e.g. **`0.94`**) if the clack should track when dice **look** settled before **`n` = 1**. |
| **`diceShakeSfxMs`** | e.g. `-40` to `500` (ms) | Main bundle | **Shake loop** schedule offset (parsed in the bundle; very large values like **`-40000`** are mapped so they behave like small negative seconds, not multi‑second delays). |
| **`diceShakeSfxOffsetMs`** | `0`–`950` (ms) | Main bundle | **Skip** this many milliseconds from the **start** of the shake WAV (useful if the file has silence at the front). |
| **`chipPushBigMin`** | `4`–`28` | Main bundle | Minimum **visible stack count** to use the **large** pot chip-push clip (`allinpushchips-96121`). Default **12**. |
| **`roomAmbience`** | `1`, `true`, `0`, or `false` | Main bundle | **`1`** / **`true`**: **Room ambience** (looped **19130** casino bed). **`0`** / **`false`**: off. **Omitted** = **`dice21_room_amb`** in `localStorage` if set (`0` / `1`), else **on** by default (same as the **Room ambience** checkbox in the Table dock). |
| **`djAmbience`** | `1`, `true`, `0`, or `false` | Main bundle | **`1`** / **`true`**: **Ambience DJ** — **silk → lush** playlist (one-shots, chained). **`0`** / **`false`**: off. **Omitted** = **`dice21_amb_dj`** in `localStorage` if set (`0` / `1`), else **on** by default (same as the **Ambience DJ** checkbox in the Table dock). |
| **`guest`** | `1` or `true` | `dice21-mp.js` | Pretend **multiplayer guest** (spectator): disables deal/bet/hit/stand, chips, mode, reset—useful for layout or HUD testing without a WebSocket room. |
| **`wsPort`** or **`mpPort`** | `1`–`65535` (e.g. `8788`) | `dice21-mp.js` | WebSocket port for **`mp-server`** (default **8788**). Use if your relay listens on a non-default port. |

### `previewStakes` details

- **Runtime:** `window.__d21Dev.previewStakesUp(n)` matches URL behavior and may open the stakes-up modal (`n` in `{1,5,25,100}`; invalid → **`5`**).
- On load, a **delayed** call may also open the stakes-up modal when `previewStakes` is present (visibility for testing).
- **Remove** `previewStakes` from the URL and reload to use your real **career** tier again.

### Example URLs

```text
/dice-21/
/dice-21/?previewStakes=100
/dice-21/?previewStakes=100&mode=fortune&reducedMotion=1
/dice-21/?guest=1&shakeHint=0
/dice-21/?previewStakes=25&mode=sharp&wsPort=9000
/dice-21/?diceSfxMs=0
/dice-21/?diceSfxHitAt=0.94&diceSfxMs=0
/dice-21/?diceShakeSfxOffsetMs=40&chipPushBigMin=14
http://localhost:5173/dice-21/?previewStakes=1&mode=classic
```

### Poker Dice

No URL overrides are implemented on **`/poker-dice/`** in this repo (multiplayer still uses the same `wsPort` / `mpPort` idea only on pages that load **`dice21-mp.js`**, i.e. Dice 21).

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

**Dev vs production URL base:** `npm run dev` always uses **`base: '/'`**. Production builds must use a **`base`** that matches the URL path where **`dist/`** is hosted (e.g. **`/dice-21/`** vs **`/arcade/`**). See **[DEPLOY.md](./DEPLOY.md)** for commands, GitHub Pages URLs, and the post-build patch.

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

## Build & hosting (static site)

This **source repo** uses **`dice-21/`**, **`poker-dice/`**, **`public/`**, and root **`index.html`** as sources; **`dist/`** is **gitignored** — build before publishing.

**Full guide:** **[DEPLOY.md](./DEPLOY.md)** — which **`npm run build`** variant to use for **`github.io/dice-21/`** vs **`github.io/arcade/dice-21/`**, why **`base`** must match the live URL, the **`patch-dice21-entry`** step, Tap to play / 404 troubleshooting, and **`BASE_PATH`** overrides.

**Short version:**

```bash
npm install
npm run build              # default: base /dice-21/ — GitHub Pages for this repo as project site
# or
npm run build:arcade       # base /arcade/ — site under .../arcade/dice-21/
```

Then deploy **everything inside** **`dist/`** to your static host (e.g. GitHub Pages branch or **`docs/`** folder).

### Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (`base` `/`) |
| `npm run build` | Production build → **`dist/`** (default **`base`**: **`/dice-21/`**) + DJ manifest + entry-chunk patch |
| `npm run build:arcade` | Same, with **`base`**: **`/arcade/`** (nested arcade deploy) |
| `npm run build:static` | **`base`**: **`./`** — local static server testing from **`dist/`** |
| `npm run preview` | Preview last **`dist/`** build (same **`base`** as last build) |
| `npm run preview:arcade` | Preview with **`base` `/arcade/`** (after **`build:arcade`**) |
| `npm run mp-server` | WebSocket relay (`mp-server.mjs`) |

Multiplayer still needs **`mp-server`** (or equivalent) reachable where the client expects it.

---

## Development notes (Dice 21 bundle)

- Game logic and 3D live in the Dice 21 **main chunk** under `public/assets/` (hashed name in some builds, e.g. `main-BosaNfoM.js`; the entry script `dice21-*.js` imports it).
- **Table SFX** (impacts, shake loop, pot chip pushes, room ambience, cash register, win sting, etc.) live under **`public/audio/`**; see **[Dice 21 — audio assets (public/audio)](#dice-21--audio-assets-publicaudio)**.
- **URL query overrides** (`previewStakes`, `mode`, `shakeHint`, `reducedMotion`, `diceSfxMs`, `diceSfxHitAt`, `diceShakeSfxMs`, `diceShakeSfxOffsetMs`, `chipPushBigMin`, `roomAmbience`, `djAmbience`, `guest`, `wsPort` / `mpPort`) are documented in **[Dice 21 — URL query parameters](#dice-21--url-query-parameters)**.
- Lifetime counters are initialized at **module top** so tier logic is safe when the logo mesh is created at startup (avoids temporal-dead-zone issues with `lsH` / `lsW`).

---

## Copyright

**Dice 21**, **Poker Dice**, and this repository’s original code and assets are **© Whittfield Holmes** (or the years stated in each file). All rights reserved unless otherwise noted.

Third-party audio and other credited assets remain under their respective licenses; see **[Dice 21 — audio assets (public/audio)](#dice-21--audio-assets-publicaudio)** and file headers where applicable.

---

## Repository

Source: [github.com/wholmes/dice-21](https://github.com/wholmes/dice-21)
