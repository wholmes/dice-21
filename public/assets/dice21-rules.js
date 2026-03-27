/**
 * Dice 21 — tunable game rules (single source of truth for balance).
 *
 * Progression is **table-based** (see `tables`): each table has a starting bank,
 * a minimum bet until you **unlock** higher `maxBetAfter` on the **same** felt.
 * Unlock when **either**:
 *   • **Wins ≥ `stakeUnlockWins`** (wins at min bet while restricted), **or**
 *   • **Bank ≥ `stakeBankMult` × `maxBetAfter`** (player stack).
 * When the **house bank hits $0**, you move to the next table (new bank, new limits).
 *
 * Load order: include before `main-BosaNfoM.js` / tournaments
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
  /** Player bank must be ≥ this multiple of `maxBetAfter` to unlock without 6 wins. */
  const STAKE_BANK_MULT = 2

  /**
   * @typedef {object} TableRule
   * @property {number} startBank — Starting chips each side (player D / house R) when you sit at this table.
   * @property {number} minBet — Only this denomination until stake tier unlocks.
   * @property {number} winsToUnlock — Doc / meter: aligns with `stakeUnlockWins` (win path).
   * @property {number} maxBetAfter — Highest chip / max bet after unlock (same table).
   * @property {number} advanceBank — Legacy scale for session **soft cap** math only; promotion uses **house bank $0** (see main bundle `d21AdvanceTableIfNeeded`).
   */

  /** Four tables — edit freely */
  const tables = [
    {
      startBank: 1500,
      minBet: 50,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 100,
      advanceBank: 15000,
    },
    {
      startBank: 3500,
      minBet: 100,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 250,
      advanceBank: 35000,
    },
    {
      startBank: 30000,
      minBet: 1000,
      winsToUnlock: STAKE_UNLOCK_WINS,
      maxBetAfter: 2500,
      advanceBank: 300000,
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

  function stakeTierUnlocked(tIdx, winsPhase1, playerBank) {
    const T = tableAt(tIdx)
    const w = winsPhase1 | 0
    const bank = playerBank == null || playerBank === undefined ? 0 : +playerBank
    if (w >= STAKE_UNLOCK_WINS) return true
    if (bank >= STAKE_BANK_MULT * T.maxBetAfter) return true
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

  /** Career tournaments — `minTable` = zero-based table index required to enter. */
  const tournaments = [
    { id: 1, name: 'Club Classic', prize: 'Big-screen TV', minTable: 0, minHands: 12, minWon: 500 },
    { id: 2, name: 'Skyline Open', prize: 'Laptop & gear', minTable: 0, minHands: 28, minWon: 5000 },
    { id: 3, name: 'Premium Gala', prize: 'Jewelry & watch', minTable: 1, minHands: 55, minWon: 15000 },
    { id: 4, name: 'Elite Showcase', prize: 'Sports car weekend', minTable: 1, minHands: 90, minWon: 40000 },
    { id: 5, name: 'High Roller Cup', prize: 'Yacht charter', minTable: 2, minHands: 125, minWon: 100000 },
    { id: 6, name: 'Grand Invitational', prize: 'Dream garage & collection', minTable: 3, minHands: 180, minWon: 300000 },
  ]

  const tournamentWinsToClinch = 2

  window.__d21Rules = {
    version: 4,
    tables,
    tournaments,
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
