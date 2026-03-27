/**
 * Dice 21 — tunable game rules (single source of truth for balance).
 *
 * Progression is **table-based** (see `tables`): each table has a starting bank,
 * a minimum bet until you **unlock** higher `maxBetAfter` on the **same** felt.
 * Unlock when **either**:
 *   • **Wins ≥ `stakeUnlockWins`** (wins at min bet while restricted), **or**
 *   • **Bank ≥ `startBank` + `stakeBankMult` × `maxBetAfter`** (stack **above** the table’s starting bank — avoids
 *     unlocking on the opening deal when `D` equals `startBank`).
 * When the **house bank hits $0**, you move to the next table (new bank, new limits). Optional
 * **alternate** promotion (see `advanceAlt*`) is tuned so **table 0 → 1** targets **~20–40 min** and
 * **each later table → next** targets **~40–60 min** (variance-heavy; bust path unchanged).
 *
 * Load order: include before the main Dice 21 bundle / tournaments
 * (see `dice-21/index.html`).
 *
 * **Hand / round state** (main bundle variable `i`): `idle` — before the first
 * deal; `play` — player’s turn; `ai` — house is resolving; `ended` — the hand
 * is over (last totals stay on screen until the next deal). A new deal is
 * allowed from `idle` or `ended` only when double-or-nothing is not pending
 * (`db` is 0). `idle` and `ended` both mean “not mid-hand,” but `ended` keeps
 * the board readable between deals; `idle` is the initial table state.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  /** Wins at min bet (while restricted) that unlock higher limits. */
  const STAKE_UNLOCK_WINS = 6
  /** Added to `startBank`: stack must reach this total to unlock via bank without 6 wins (`stakeBankMult` × `maxBetAfter`). */
  const STAKE_BANK_MULT = 2

  /**
   * @typedef {object} TableRule
   * @property {number} startBank — Starting chips each side (player D / house R) when you sit at this table.
   * @property {number} minBet — Only this denomination until stake tier unlocks.
   * @property {number} winsToUnlock — Doc / meter: aligns with `stakeUnlockWins` (win path).
   * @property {number} maxBetAfter — Highest chip / max bet after unlock (same table).
   * @property {number} advanceBank — Legacy scale for session **soft cap** math only.
   * @property {number} [advanceAltNetProfit] — Optional: net stack gain (player `D` − `startBank`) required with **`advanceAltPlayerWins`** to promote **without** busting the house (house `R` must stay above zero).
   * @property {number} [advanceAltPlayerWins] — Optional: player wins **this table** (resolved hands where you take the pot) paired with **`advanceAltNetProfit`** for the alternate promotion path.
   */

  /** Four tables — edit freely */
  const tables = [
    {
      startBank: 1500,
      minBet: 50,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 100,
      advanceBank: 15000,
      /** Alternate path — pacing target ~20–40 min (with bust path). */
      advanceAltNetProfit: 750,
      advanceAltPlayerWins: 12,
    },
    {
      startBank: 3500,
      minBet: 100,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 250,
      advanceBank: 35000,
      /** Alternate path — pacing target ~40–60 min (heavier than table 0). */
      advanceAltNetProfit: 4500,
      advanceAltPlayerWins: 24,
    },
    {
      startBank: 30000,
      minBet: 1000,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 2500,
      advanceBank: 300000,
      /** Alternate path — pacing target ~40–60 min (same band as 1 → 2). */
      advanceAltNetProfit: 52000,
      advanceAltPlayerWins: 26,
    },
    {
      startBank: 300000,
      minBet: 10000,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 25000,
      advanceBank: 3000000,
      /** After unlock, only these two denominations (high roller). */
      denomsAfter: [10000, 25000],
    },
  ]

  const LADDER = Object.freeze([
    1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000,
  ])

  function tableAt(i) {
    const n = i | 0
    if (n < 0 || n >= tables.length) return tables[0]
    return tables[n]
  }

  function stakeBankUnlockMin(tIdx) {
    const T = tableAt(tIdx)
    const sb = T.startBank || 0
    return sb + STAKE_BANK_MULT * (T.maxBetAfter | 0)
  }

  function stakeTierUnlocked(tIdx, winsPhase1, playerBank) {
    const T = tableAt(tIdx)
    const w = winsPhase1 | 0
    const bank = playerBank == null || playerBank === undefined ? 0 : +playerBank
    if (w >= STAKE_UNLOCK_WINS) return true
    if (bank >= stakeBankUnlockMin(tIdx)) return true
    return false
  }

  /**
   * Whether the player is still on “minimum bet only” for this table.
   * @param {number} [playerBank] — Player stack; omit or 0 to ignore bank path.
   */
  function isRestricted(tIdx, winsPhase1, playerBank) {
    return !stakeTierUnlocked(tIdx, winsPhase1, playerBank)
  }

  /**
   * Max bet (chip value) allowed **right now** for this table + progress.
   */
  function maxBetFor(tIdx, winsPhase1, playerBank) {
    const T = tableAt(tIdx)
    return isRestricted(tIdx, winsPhase1, playerBank) ? T.minBet : T.maxBetAfter
  }

  /**
   * Chip denominations available for betting at this table + progress.
   */
  function chipDenomsFor(tIdx, winsPhase1, playerBank) {
    const T = tableAt(tIdx)
    if (isRestricted(tIdx, winsPhase1, playerBank)) return [T.minBet]
    if (Array.isArray(T.denomsAfter) && T.denomsAfter.length) {
      return T.denomsAfter.slice().sort((a, b) => a - b)
    }
    const lo = LADDER.indexOf(T.minBet)
    const hi = LADDER.indexOf(T.maxBetAfter)
    if (lo >= 0 && hi >= 0 && hi >= lo) return LADDER.slice(lo, hi + 1)
    return [T.minBet, T.maxBetAfter]
  }

  /** Soft cap for session restore clamp (generous vs advance target). */
  function bankSoftCap(tIdx) {
    const T = tableAt(tIdx)
    return Math.max(T.startBank * 100, T.advanceBank * 10, 1e9)
  }

  /** True when alternate promotion thresholds are met (caller must still require R > 0 and not be on the last table). */
  function advanceAltMet(tIdx, playerBank, playerWinsAtTable) {
    const T = tableAt(tIdx)
    if (typeof T.advanceAltNetProfit !== 'number' || typeof T.advanceAltPlayerWins !== 'number') return false
    const start = T.startBank || 0
    const net = (playerBank == null ? 0 : +playerBank) - start
    return net >= T.advanceAltNetProfit && (playerWinsAtTable | 0) >= T.advanceAltPlayerWins
  }

  /**
   * One **lifetime** championship (career totals from `dice21_lifetime_v1`) and one **table cup** per felt.
   * Table cups use stats accumulated **on that table only** (`dice21_tournament_state_v1` in tournaments script).
   */
  const tournamentLifetime = Object.freeze({
    id: 'life',
    name: 'Hall of Fame',
    prize: 'Legend ring (fantasy)',
    minHands: 60,
    minWon: 50000,
  })

  const tournamentByTable = Object.freeze([
    { tableIndex: 0, name: 'Club Cup', prize: 'Lounge upgrade (fantasy)', minHands: 6, minWon: 300 },
    { tableIndex: 1, name: 'Skyline Cup', prize: 'City suite night (fantasy)', minHands: 8, minWon: 8000 },
    { tableIndex: 2, name: 'Summit Cup', prize: 'Jewelry & watch (fantasy)', minHands: 10, minWon: 40000 },
    { tableIndex: 3, name: 'Pinnacle Cup', prize: 'Garage weekend (fantasy)', minHands: 12, minWon: 400000 },
  ])

  const tournamentWinsToClinch = 2

  window.__d21Rules = {
    version: 8,
    tables,
    tournamentLifetime,
    tournamentByTable,
    tournamentWinsToClinch,
    ladder: LADDER,
    stakeUnlockWins: STAKE_UNLOCK_WINS,
    stakeBankMult: STAKE_BANK_MULT,
  }

  window.__d21RulesTableAt = tableAt
  window.__d21RulesMaxBetFor = maxBetFor
  window.__d21RulesChipDenomsFor = chipDenomsFor
  window.__d21RulesIsRestricted = isRestricted
  window.__d21RulesBankSoftCap = bankSoftCap
  window.__d21RulesAdvanceAltMet = advanceAltMet
  window.__d21RulesStakeBankUnlockMin = stakeBankUnlockMin

  /**
   * Back-compat: returns current max bet for badges / old call sites.
   */
  window.__d21RulesStakeTierMax = function (h, w) {
    void h
    void w
    if (typeof window.__d21GameTableIndex === 'number') {
      const ti = window.__d21GameTableIndex | 0
      const w1 = window.__d21GameWinsPhase1 | 0
      const bank =
        typeof window.__d21GamePlayerBank === 'number' ? window.__d21GamePlayerBank : 0
      return maxBetFor(ti, w1, bank)
    }
    return 50
  }

  window.__d21RulesStakeProgressPaths = function () {
    return []
  }
})()
