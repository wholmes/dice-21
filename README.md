# Dice 21 & Poker Dice

Two browser games in one [Vite](https://vitejs.dev/) multi-page app: **Dice 21** is the home page (`/` and `/dice-21/`), and **Poker Dice** lives at `/poker-dice/`. Both can use an optional **Node WebSocket server** for online two-player sessions.

**Deploy / GitHub Pages / `BASE_PATH`:** see **[DEPLOY.md](./DEPLOY.md)**.

---

## Dice 21 — how to play

**Goal:** Get closer to **21** than the house without going **over** (busting). You play against the dealer, not other seats.

### Hand state (between rounds)

The game tracks a **`hand` / `round` state** (see the header comment in **`dice21-rules.js`**):

- **`idle`** — Before the first deal at the table (totals show "—").
- **`play`** — Your turn (hit / stand).
- **`ai`** — The house is resolving.
- **`ended`** — The hand is over; **last totals stay visible** until the next deal.

A new deal is allowed from **`idle`** or **`ended`** only when **double-or-nothing** is not pending. **`idle`** and **`ended`** both mean “not mid-hand,” but **`ended`** keeps the last scores on the felt until you bet again.

### One round

1. **Pick a chip** (denominations depend on **career table** + unlocks; the first career table uses **$50**, then higher chips after you **unlock** that table’s upper limit—**6** wins at min bet **or** player bank **≥ 2×** that table’s **`maxBetAfter`**—see **`dice21-rules.js`**) and press **Bet** (or the main bet control). You and the house each put that amount in; the **pot** is both antes combined (e.g. a **$50** bet ⇒ **$100** in the pot before dice).
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

The panel tracks **lifetime** net, won, lost, and hands played. **Lifetime $ won** (`lsW`) is the running total of **pot payouts on your wins** (full pot each time)—used for the HUD, **achievements**, and **tournament gates** (`minWon`). It does **not** change your per-hand **max bet**; that comes from the **career table** rules (see below). Stats are stored in the browser (`localStorage`) unless you reset.

**Stake unlock badges (Club / Premium / Elite)** — These unlock when your **effective max bet** (`d21StakeTierMax()`) **increases** across real thresholds for the first time (not on every load): **$100** (Club), **$250** (Premium), **$2,500** (Elite). The first sync after a fresh session **baselines** the tracked max so clearing achievements does **not** instantly re-award these badges.

**Money-scaled badges** (main bundle; tuned for the current **`tables`** min bets and banks):

| Id | Summary |
|----|---------|
| **high_roller** | Win a hand with **pot ≥ $200** and **lifetime $ won ≥ $2,000** (same career total as the old `$100` / `$2k` bar, but the pot must be a “big” bet—e.g. **$100** wager ⇒ **$200** pot at resolution). |
| **blackjack_soul** | Win with **21** and **lifetime $ won ≥ $6,000**. |
| **on_heater** | **4+** win streak and **lifetime $ won ≥ $8,000**. |
| **double_dare** | Win **double-or-nothing** when **lifetime $ won ≥ $15,000**. |
| **one_chip** | Win a pot while betting **exactly the current table’s `minBet`** (from **`dice21-rules.js`**, not a hardcoded **$1**). |

Other badges (first hand, first blood, dealer modes, pushes, lucky 7, house bust, Fortune 21, **century** 100 hands, etc.) follow the descriptions in the in-game **Badges** list.

### Center panel & Mode dock layout

- **Center panel** (`#ui .panel`): **Totals** row (**You / Pot / House**) first; then **one row** with **Bankroll ($)** on the **left** and the **+/−** expand control for **rules & messages** on the **right**; **rule hint** and **message** sit **below** that row.
- **Lower-right** (**Mode** dock, `#feltDock`): **“Dice 21”** as the title, then **Mode** (dealer rules), **Shake hint**, **Room ambience**, **Ambience DJ**.

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

## Dice 21 — rules config & balance (`dice21-rules.js`)

**Authoritative tunables** live in **`public/assets/dice21-rules.js`**. It runs as a normal (non-module) script **before** the main game bundle and **`dice21-tournaments.js`** (see **`dice-21/index.html`**). Edit that file and refresh—no need to change the minified main chunk for stake numbers.

### What it defines

| Export / global | Role |
|-----------------|------|
| **`window.__d21Rules`** | `{ version, tables, tournaments, tournamentWinsToClinch, ladder, stakeUnlockWins, stakeBankMult }` — authoritative numbers for career tables, chip ladder, tournaments, and stake-unlock tuning. |
| **`window.__d21RulesTableAt(i)`** | Returns the **`tables[i]`** rule object (clamped). |
| **`window.__d21RulesMaxBetFor(ti, w1, bank?)`** | Max bet for table **`ti`**, phase-1 win count **`w1`**, and optional player stack **`bank`** (defaults to **`0`** if omitted). Uses the **stake tier unlock** rule below. |
| **`window.__d21RulesChipDenomsFor(ti, w1, bank?)`** | Chip denominations (min bet only until unlocked, then **`ladder`** slice or **`denomsAfter`**). |
| **`window.__d21RulesIsRestricted(ti, w1, bank?)`** | `true` while still on **min bet only** — i.e. neither unlock condition is met (see **Stake tier unlock** below). |
| **`window.__d21RulesBankSoftCap(ti)`** | Upper bound used when **restoring** stacks from **`dice21_table_session_v1`**. |
| **`window.__d21RulesStakeTierMax(h, w)`** | Name kept for compatibility; **ignores** `h` and `w`. Returns **`maxBetFor`** using **`window.__d21GameTableIndex`**, **`window.__d21GameWinsPhase1`**, and **`window.__d21GamePlayerBank`** when set; otherwise **`50`**. Used for badges and theming keyed off numeric max bet. |
| **`window.__d21RulesStakeProgressPaths()`** | Always returns **`[]`**. Stake **meter** / **hint** are implemented in the main bundle (stake unlock progress + house bank toward next table), not via this hook. |

### Semantics (important)

- **Stake tier unlock (same table, higher `maxBetAfter`)** — You leave **min bet only** when **either**:
  - **`w1` ≥ `stakeUnlockWins`** (default **6**) — player wins counted while restricted (phase-1 wins at min bet), **or**
  - **Player bank ≥ `stakeBankMult` × `maxBetAfter`** (defaults: **2×** that row’s **`maxBetAfter`**).
  Constants **`stakeUnlockWins`** and **`stakeBankMult`** live on **`window.__d21Rules`**; the main bundle passes **`D`** into rules as **`window.__d21GamePlayerBank`** (synced in **`d21SyncGameGlobals()`**). Table field **`winsToUnlock`** matches **`stakeUnlockWins`** for docs, URL caps, and copy.
- **`tables`** — Each row: **`startBank`**, **`minBet`**, **`winsToUnlock`**, **`maxBetAfter`**, **`advanceBank`** (soft-cap scaling only), and optionally **`denomsAfter`** (e.g. last table: only **`$10,000`** and **`$25,000`** chips after unlock).
- **`ladder`** — Ordered denominations used when **`denomsAfter`** is absent: **`chipDenomsFor`** slices **`window.__d21Rules.ladder`** from **`minBet`** through **`maxBetAfter`** (inclusive).
- **`tournaments`** — Six objects: `id`, `name`, `prize`, **`minTable`** (zero-based career table index required), **`minHands`**, **`minWon`** (lifetime stats). See **[Career tournaments](#dice-21--career-tournaments)**.
- **`tournamentWinsToClinch`** — Wins needed to win a tournament series (default **2**, “first to 2”).

If **`dice21-rules.js`** fails to load, the main bundle still runs with fallbacks for chip lists; **`dice21-tournaments.js`** embeds a **default** tournament list matching the shipped **`dice21-rules.js`**.

### Keeping copy in sync

The **stake help** modal in **`dice-21/index.html`** explains **table-based** limits (not read from rules at runtime—edit both when copy should track **`dice21-rules.js`**, including the **6 wins / 2× bank** unlock summary).

---

## Dice 21 — progressive stakes & bankroll

Authoritative numbers are in **`public/assets/dice21-rules.js`**. If this section disagrees with that file, trust the file.

### Career table ladder (`tables` in `dice21-rules.js`)

Each **career table** row defines **`startBank`** (starting chips **each side** — player **`D`** / house **`R`**), **`minBet`** (only that chip until unlock), **`winsToUnlock`** (aligned with **`stakeUnlockWins`**, usually **6**), then **`maxBetAfter`** on the **same** felt. Optional **`denomsAfter`** replaces the default **`ladder`** slice (used on the last table so only **$10,000** and **$25,000** appear after unlock).

- **Stake gate:** Until unlock, you may bet only **`minBet`**. Unlock by **6** wins at min bet (while restricted) **or** by reaching **bank ≥ 2× `maxBetAfter`**. Then **`chipDenomsFor`** exposes the allowed higher denominations (from **`ladder`** or **`denomsAfter`**).
- **Promotion:** You move to the **next** career table when the **house bank hits $0** after a resolved hand (`d21AdvanceTableIfNeeded`). **`advanceBank`** is **not** the promotion trigger—it only feeds **`bankSoftCap`** for session restore clamping.
- **Last table:** When the house bank hits **$0**, there is no next table—the **house** refills to **`startBank`**, **HOUSE BUSTED** toast, you keep your chips. Earlier tables show **NEXT TABLE** when the house hits **$0**.

| Table (index) | Min bet until unlock | After unlock (chips / max) | `startBank` (each side) | `winsToUnlock` |
|---------------|----------------------|----------------------------|--------------------------:|---------------:|
| 0 | $50 | $50–$100 (ladder slice) | $1,500 | 6 |
| 1 | $100 | $100–$250 | $3,500 | 6 |
| 2 | $1,000 | $1,000–$2,500 | $30,000 | 6 |
| 3 | $10,000 | **$10,000 + $25,000 only** (`denomsAfter`) | $300,000 | 6 |

**Felt / theme** follows **table index** (`d21ApplyTableTheme`).

### In-session stake UI (main bundle)

- **Stake hint** (`#d21StakeHint`) and **stake meter** describe **(a)** progress toward unlock (**wins** and/or **bank** vs **2× maxBetAfter**), **(b)** house bank toward busting them, or **(c)** “final table” — not lifetime grind tables.
- **Max bet** during play is **`maxBetFor(ti, w1, D)`** from rules (or **`previewStakes`** URL override — see [URL parameters](#dice-21--url-query-parameters)).
- **Chip dock** — Buttons use **`data-denom`**; the main bundle shows or hides each denomination according to **`chipDenomsFor`**, and tints 3D chips by value.
- **Stakes-up modal** — May appear when your effective max bet **increases** (e.g. crossing the win gate on a table), separate from tournament prizes.

### Lifetime stats vs table limits

- **`lsH`** / **`lsW`** (lifetime hands and lifetime pot won) power the **HUD**, **achievements**, and **[tournament](#dice-21--career-tournaments) gates** (`minHands`, `minWon`). They do **not** raise on-table max bet in the shipped build.
- **Club / Premium / Elite** badges fire when the **effective max bet** (`d21StakeTierMax()`) **increases** across **≥ $100**, **≥ $250**, and **≥ $2,500** respectively (see **[Badges & lifetime stats](#badges--lifetime-stats)**).

### Historical (removed) — lifetime “stake tier” ladder

Older docs and UI sometimes described unlocking **$5 / $25 / $100** max bet from **lifetime** hands + pot won, with “standard” and “hot” threshold tables. **That ladder is not implemented** in the current main bundle: chip limits come from **`tables`**, the **stake tier unlock** rule (**`stakeUnlockWins`** / **`stakeBankMult`** on **`__d21Rules`**), and **`denomsAfter`**. Do not copy old tier tables into this README as if they were authoritative.

**Overlap to be aware of:** **Tournament 1** ([Club Classic](#dice-21--career-tournaments)) uses **`minHands: 12`** and **`minWon: 500`** — gate thresholds are **independent** of per-table min/max bet (`tables`); they only control tournament entry.

**Where lifetime stats matter today:** HUD, achievements (separate numeric checks in the bundle), and **tournament** gates — see the **`tournaments`** table in **`dice21-rules.js`**.

### Table bankroll persistence (sessions)

Current **table** chips (`D` / `R`), selected chip **`g`**, **table index** **`ti`**, and **phase-1 win count** **`w1`** are saved to **`localStorage`** as **`dice21_table_session_v1`** (prefer **`v: 2`** with **`ti`**, **`w1`**, **`D`**, **`R`**, **`g`**; older **`v: 1`** stored **`D`**, **`R`**, **`g`** only — missing **`ti`** / **`w1`** defaults are applied on load). On load, stacks are **capped** by **`bankSoftCap(ti)`** in `dice21-rules.js`. After load, **`d21SyncGameGlobals()`** sets **`window.__d21GamePlayerBank`** from **`D`** so **`maxBetFor`** / **`isRestricted`** match session state.

**Starting stacks** for a table come from **`d21BankrollBase()`** in the main bundle: each side gets that table’s **`startBank`** when rules load (fallback **`100 × maxBet`** only if rules are missing).

**Stacks reset** to **`startBank`** each side when you use **Reset all progress**, or when dev **felt swatches** force a fresh table setup in **`dice-21/index.html`**. Unlocking higher bet limits **without** those actions does **not** refill stacks.

---

## Dice 21 — career tournaments

Optional **best-of series** mini-events (fantasy prizes only). Implemented in **`public/assets/dice21-tournaments.js`**, with **gates** and **series length** defined in **`public/assets/dice21-rules.js`** (`tournaments`, `tournamentWinsToClinch`).

### Design choices

- **Real bankroll** — You play normal hands with your table chips; no separate “entry fee” currency.
- **Lifetime still counts** — Hands and **`lsW`** update exactly like outside a tournament.
- **Gates** — Each event requires a **minimum career table** (`minTable`: **0**–**3**), **minimum lifetime hands** (`lsH`), and **minimum lifetime $ won** (`lsW`). These thresholds are independent of the per-table **stake tier unlock** (wins / bank toward **`maxBetAfter`**).
- **Order** — Events **1 → 6** must be **cleared in order**; event **1** has no prerequisite.
- **Series** — **First to `tournamentWinsToClinch` wins** (default **2**). **Pushes** do not move the series.
- **Double-or-nothing** — **Off** while a series is active (and the double `db` state is not set on wins during a series).
- **Multiplayer** — **Disabled for guests** (`window.__d21Role === 'guest'`): spectators do not see tournament UI; becoming a guest clears an in-progress run. **Hosts** and **solo** play can use tournaments.

### Default tournament list (see `dice21-rules.js` for edits)

| # | Name | Prize (flavor) | `minTable` | Min hands | Min $ won |
|---|------|----------------|------------|-----------|-----------|
| 1 | Club Classic | Big-screen TV | 0 | 12 | 500 |
| 2 | Skyline Open | Laptop & gear | 0 | 28 | 5000 |
| 3 | Premium Gala | Jewelry & watch | 1 | 55 | 15000 |
| 4 | Elite Showcase | Sports car weekend | 1 | 90 | 40000 |
| 5 | High Roller Cup | Yacht charter | 2 | 125 | 100000 |
| 6 | Grand Invitational | Dream garage & collection | 3 | 180 | 300000 |

Tournament keys **`dice21_tournament_done`** and **`dice21_tournament_run`** are documented in the **[browser storage master table](#dice-21--browser-storage-master-table)**.

### Hooks from the main bundle

The minified main chunk calls **`window.__d21TournamentAfterHand(result)`** after each resolved hand, **`window.__d21TournamentNoDouble()`** to skip double-offer during a series, and **`window.__d21TournamentReset()`** on **Reset all progress**. **`dice21-mp.js`** hides the tournaments panel for guests and fires **`d21-rolechange`** when MP role changes.

---

## Dice 21 — table look

The shipped game uses **one** default felt mesh and **one** neutral “21 · DICE 21” logo texture. **Career table index** (rules + session) controls **bet limits**, **starting stacks** (`startBank`), and **felt appearance**—not separate 3D rooms. **Club / Premium / Elite** badges unlock when **effective max bet** first crosses **$100 / $250 / $2,500** (see **[Badges & lifetime stats](#badges--lifetime-stats)**).

A **felt swatch** strip exists in **`dice-21/index.html`** for palette reference but is **hidden** in normal play. The **3D felt** uses **`d21ApplyTableTheme`**: **`d21FeltIndexForTier()`** maps **career `d21TableIdx`** to felt **0…7** (clamped), so higher tables change the look automatically.

### Drinks on the table & Call server

After the **camera intro**, a **single drink** sits in a fixed spot on the back of the felt (purely atmospheric). **Call server** (bell beside Bet / Hit / Stand) opens a menu: **Coffee**, **Liquor** (whisky glass with ice), or **Beer** (pint-style glass with foam). Your choice is remembered (`dice21_drink_v1` in `localStorage`) and only **one** prop is shown at a time. **Click the drink** to “sip” (level drops slightly). **Reset all progress** returns the drink to **liquor**. These are cosmetic; they do not change odds or payouts.

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

**Room ambience** is **`freesound_community-casino-ambiance-19130.wav`** (`ambRoom`): one looped casino bed when **Room ambience** is on.

**Ambience DJ** loads **additional** tracks from **`public/audio/dj/`** using **`public/audio/dj/manifest.json`**: each entry is a filename that gets decoded into a pool. When DJ is on, the game **picks randomly** from that pool (one-shots chained over time), layered independently of the room loop.

| File | Role |
|------|------|
| **`freesound_community-casino-ambiance-19130.wav`** | **Room ambience** only (looped; Table dock **Room ambience**). |
| **`public/audio/dj/*.wav`** | **Ambience DJ** — whichever files are listed in **`manifest.json`** (defaults include **lush** and **silk** tracks; add WAVs and regenerate the manifest). |

**Build / dev:** **`predev`** / **`prebuild`** run **`sync-audio`** and **`dj:manifest`** before Vite (`scripts/generate-dj-manifest.mjs` refreshes **`manifest.json`** from WAVs in **`public/audio/dj/`**). After adding or renaming DJ tracks, rebuild or run `npm run dj:manifest` so the client loads them.

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
| **`previewStakes`** | `1`, `5`, `25`, `100`, or **empty** | Main game bundle | **Preview max bet** for this load only (dev subset — not every chip value exists in this list). Overrides **`d21StakeTierMax()`**–driven bankroll/hints; felt stays default. Does **not** change lifetime stats. Invalid number → **`5`**. Empty → **`5`**. Does **not** apply career **`tables`**—use **`d21Table`** / **`d21Phase1`** (or **`jumpTable`**) to test ladder rows. |
| **`d21Table`** | `0` … `tables.length − 1` (integer, **0-based**) | Main bundle | **Testing:** jump to a **career table** from **`dice21-rules.js`** `tables`. Resets **both** stacks to that table’s **`startBank`**, applies felt by table index, and **removes** `dice21_table_session_v1` for this load. **Omitted** = normal load from saved session / defaults. |
| **`d21Phase1`** | `0` … `winsToUnlock` (integer) | Main bundle | **Testing:** only with **`d21Table`**. Sets how many **player wins while on min bet** to simulate (capped per table). **`0`** = still restricted to min bet unless your **bank** alone would unlock (**≥ 2×** that table’s **`maxBetAfter`**). **`6`** (when `winsToUnlock` is **6**) = **unlocked** via wins on that table. **Omitted** → **`0`**. |
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

- **Runtime:** `window.__d21Dev.previewStakesUp(n)` matches URL behavior and may open the stakes-up modal (`n` in `{1,5,25,100}` only; invalid → **`5`**).
- On load, a **delayed** call may also open the stakes-up modal when `previewStakes` is present (visibility for testing).
- **Remove** `previewStakes` from the URL and reload to use normal **career table** limits from **`dice21-rules.js`** (saved session / defaults).

### Testing table progression (`d21Table` / `d21Phase1`)

Use these to **skip ahead** in the **table-based** career ladder (banks, min bet until **stake unlock**, then higher chip limits on that felt; **promotion** in normal play is when the **house bank hits $0**) without grinding. They apply **after** `dice21-rules.js` loads.

- **`d21Table`** — **0** = first table, **1** = second, … up to **`tables.length − 1`** (see **`public/assets/dice21-rules.js`**). Invalid or out-of-range values are **clamped**.
- **`d21Phase1`** — Optional. Simulates **player wins at min bet** on that table (capped at that table’s **`winsToUnlock`**, usually **6**). To see **full chip rows** after unlock (e.g. **$10,000** / **$25,000** on the last table), set this to **`winsToUnlock`** (often **`6`**). Omit or use **`0`** to stay on **min bet only** (unless starting **`D`** from **`startBank`** already meets the **2× maxBetAfter** bank shortcut).

**Console (no reload):** `window.__d21Dev.jumpTable(tableIndex, phase1Wins)` — same semantics; **`phase1Wins`** may be omitted (treated as **`0`**). Clears the saved table session and refreshes felt, chips, and meter.

**Remove** `d21Table` / `d21Phase1` from the URL and reload to return to normal **saved-session** behavior (or play without those params so stacks persist again).

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
/dice-21/?d21Table=2
/dice-21/?d21Table=3&d21Phase1=6
```

### Poker Dice

No URL overrides are implemented on **`/poker-dice/`** in this repo (multiplayer still uses the same `wsPort` / `mpPort` idea only on pages that load **`dice21-mp.js`**, i.e. Dice 21).

---

## Dice 21 — reset progress

**Reset all progress** (Lifetime section) does the following:

- Zeros **lifetime stats** and **badges**, resets **career table** to the first table with **phase-1 wins** at **0**, **bankrolls** to **`startBank`** for that table, and **current hand** / pot / double / toss state (the **visual table** stays the same either way).
- Removes **table session** and **tournament** keys; calls **`window.__d21TournamentReset()`** (see **`dice21-tournaments.js`**).
- Sets the **drink** choice back to **liquor** (still stored under **`dice21_drink_v1`**).

Keys and exact behavior are listed in the **[master table](#dice-21--browser-storage-master-table)** below. **Not** cleared on reset: dealer mode, ambience, shake overlay, camera save, server hint flags, felt swatch index, mobile panel open/closed prefs, and **`sessionStorage`** multiplayer keys (tab-scoped).

For a **full** wipe of every persisted pref, clear site data for the origin or use a private window.

---

## Dice 21 — browser storage (master table)

All **Dice 21** persistence uses fixed string keys. Values are **JSON** unless noted.

### `localStorage`

| Key | Typical value | Purpose | **Reset all progress** |
|-----|---------------|---------|------------------------|
| **`dice21_lifetime_v1`** | `{ "net", "won", "lost", "hands" }` (numbers) | Lifetime counters for HUD, achievements, tournament gates | Cleared (rewritten to zeros) |
| **`dice21_achievements_v1`** | `{ "u": [ …achievement ids ], "p": number }` | Unlocked badges (`u`) and push counter (`p`) | Cleared |
| **`dice21_table_session_v1`** | `{ "v": 2, "ti", "w1", "D", "R", "g" }` (older v1: `D`, `R`, `g` only) | Table index, phase-1 win count, chip stacks, selected denomination | **Removed** |
| **`dice21_tournament_done`** | JSON array of event **id** numbers | Finished career tournaments | **Removed** |
| **`dice21_tournament_run`** | `{ "id", "wins", "losses" }` or absent | Active tournament series | **Removed** |
| **`dice21_drink_v1`** | `"coffee"` \| `"liquor"` \| `"beer"` | Drink prop on the felt | Set to **`"liquor"`** |
| **`dice21_mode_v1`** | `"classic"` \| `"sharp"` \| `"chill"` \| `"fortune"` | Dealer mode | **Unchanged** |
| **`dice21_room_amb`** | `"0"` \| `"1"` | Room ambience loop on/off | **Unchanged** |
| **`dice21_amb_dj`** | `"0"` \| `"1"` | Ambience DJ playlist on/off | **Unchanged** |
| **`dice21_shake_hint_overlay`** | `"0"` \| `"1"` | Shake hint overlay preference | **Unchanged** |
| **`dice21_camera_view_v1`** | JSON (`v: 1`, camera pose fields) | Saved table camera view | **Unchanged** |
| **`dice21_felt_i`** | String (swatch index) | Selected felt swatch (if used) | **Unchanged** |
| **`dice21_server_used_v1`** | `"1"` when set | Call-server feature has been used | **Unchanged** |
| **`dice21_server_hint_shown_v1`** | `"1"` when set | One-shot hint for the server / bell | **Unchanged** |
| **`d21_ui_lifeDetails_open`** | `"0"` \| `"1"` | Lifetime `<details>` open on mobile | **Unchanged** |
| **`d21_ui_achDetails_open`** | `"0"` \| `"1"` | Badges `<details>` open on mobile | **Unchanged** |
| **`d21_ui_panelHelp_open`** | `"0"` \| `"1"` | Rules/help panel expanded | **Unchanged** |
| **`d21_ui_badgeOverlay_open`** | `"0"` \| `"1"` | Badge overlay open preference | **Unchanged** |

### `sessionStorage` (multiplayer only — `dice21-mp.js`)

Cleared when the tab closes; not touched by **Reset all progress**.

| Key | Typical value | Purpose |
|-----|---------------|---------|
| **`d21_mp_session`** | Server session id string | Reconnect / resume WebSocket session |
| **`d21_mp_room`** | 4-character room code | Current room |
| **`d21_mp_role`** | `"host"` \| `"guest"` | Multiplayer role for this tab |

---

## Requirements & run locally

- **Node.js** 18+

```bash
npm install
npm run dev
```

Vite prints the URL (often `http://localhost:5173/`; the port changes if that one is busy). Open **`/`** or **`/dice-21/`** for Dice 21, **`/poker-dice/`** for Poker Dice.

**Dev vs production URL base:** `npm run dev` always uses **`base: '/'`**. Production builds must use a **`base`** that matches the URL path where **`dist/`** is hosted (e.g. **`/dice-21/`** vs **`/arcade/`**). See **[DEPLOY.md](./DEPLOY.md)** for commands, GitHub Pages URLs, and the post-build patch.

**Dice 21 scripts:** Tunables and tournament definitions are plain files under **`public/assets/`** — especially **`dice21-rules.js`** (load first) and **`dice21-tournaments.js`** — wired from **`dice-21/index.html`**. The core game ships as a **prebuilt** hashed bundle (**`main-*.js`**) in the same folder; this repo does not include a separate unminified source tree for that file.

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
| `npm run dj:manifest` | Regenerate **`public/audio/dj/manifest.json`** from WAVs in **`public/audio/dj/`** |
| `npm run dev` | Vite dev server (`base` `/`). **`predev`** runs **`sync-audio`** then **`dj:manifest`**. |
| `npm run build` | **`prebuild`** → **`sync-audio`** → **`dj:manifest`** → Vite build → **`dist/`** (default **`base`**: **`/dice-21/`**) + **`patch-dice21-entry`**. |
| `npm run build:arcade` | **`dj:manifest`** then Vite with **`base` `/arcade/`** — run after a normal **`sync-audio`** if audio changed. |
| `npm run build:static` | **`base`**: **`./`** — local static server testing from **`dist/`** |
| `npm run preview` | Preview last **`dist/`** build (same **`base`** as last build) |
| `npm run preview:arcade` | Preview with **`base` `/arcade/`** (after **`build:arcade`**) |
| `npm run mp-server` | WebSocket relay (`mp-server.mjs`) |

Multiplayer still needs **`mp-server`** (or equivalent) reachable where the client expects it.

---

## Development notes (Dice 21 bundle)

- Game logic and 3D live in the Dice 21 **main chunk** under `public/assets/` (hashed name in some builds, e.g. `main-BosaNfoM.js`; the entry script `dice21-*.js` imports it).
- **Table SFX** (impacts, shake loop, pot chip pushes, room ambience, cash register, win sting, etc.) live under **`public/audio/`**; see **[Dice 21 — audio assets (public/audio)](#dice-21--audio-assets-publicaudio)**.
- **`npm run dj:manifest`** (see **`scripts/generate-dj-manifest.mjs`**) regenerates **`public/audio/dj/manifest.json`** before **`predev`** / **`prebuild`** so new DJ WAVs are picked up without hand-editing JSON.
- **Bet limits** — `d21StakeTierMax()` → `__d21RulesMaxBetFor(d21TableIdx, d21WinsPhase1, D)` (or **`previewStakes`**). **`d21StakeHintText`** / **`d21StakeMeterUpdate`** reflect **stake unlock** (wins **or** bank) and **house bank** toward the next table, not a lifetime **`lsH` / `lsW`** ladder.
- **Selected chip `g`** when no denomination fits the bank — **`te()`** clamps using the table’s **`minBet`** from **`__d21RulesTableAt(d21TableIdx)`** (not a hardcoded **$50**).
- **URL query overrides** (`previewStakes`, `d21Table`, `d21Phase1`, `mode`, `shakeHint`, `reducedMotion`, `diceSfxMs`, `diceSfxHitAt`, `diceShakeSfxMs`, `diceShakeSfxOffsetMs`, `chipPushBigMin`, `roomAmbience`, `djAmbience`, `guest`, `wsPort` / `mpPort`) are documented in **[Dice 21 — URL query parameters](#dice-21--url-query-parameters)**.
- **`window.__d21Dev`** exposes helpers such as **`previewStakesUp(n)`**, **`jumpTable(ti, w1)`** (test table ladder without URL reload), **`ambienceDj` / `ambienceRoom`**, and getters for quick tuning without URL flags.
- Lifetime counters (`lsH`, `lsW`, …) are initialized at **module top** so the HUD and achievements stay consistent when the scene boots (avoids temporal-dead-zone issues with late imports).

---

## Copyright

**Dice 21**, **Poker Dice**, and this repository’s original code and assets are **© Whittfield Holmes** (or the years stated in each file). All rights reserved unless otherwise noted.

Third-party audio and other credited assets remain under their respective licenses; see **[Dice 21 — audio assets (public/audio)](#dice-21--audio-assets-publicaudio)** and file headers where applicable.

---

## Repository

Source: [github.com/wholmes/dice-21](https://github.com/wholmes/dice-21)
