/**
 * Dice 21 — tunable game rules (single source of truth for balance).
 *
 * Progression is **table-based** (see `tables`): each table has a starting bank,
 * a minimum bet until you hit `winsToUnlock` wins, then higher `maxBetAfter`
 * on the **same** felt. When the **house bank hits $0**, you move to the
 * next table (new bank, new limits). Tweak numbers here and refresh.
 *
 * Load order: include before `main-BosaNfoM.js` / tournaments
 * (see `dice-21/index.html`).
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  /**
   * @typedef {object} TableRule
   * @property {number} startBank — Starting chips each side (player D / house R) when you sit at this table.
   * @property {number} minBet — Only this denomination until `winsToUnlock` player wins at this table.
   * @property {number} winsToUnlock — Player wins needed (while on min bet) to unlock `maxBetAfter`.
   * @property {number} maxBetAfter — Highest chip / max bet after the win gate (same table).
   * @property {number} advanceBank — Legacy scale for session **soft cap** math only; promotion uses **house bank $0** (see main bundle `d21AdvanceTableIfNeeded`).
   */

  /** Four tables — edit freely */
  const tables = [
    {
      startBank: 100,
      minBet: 5,
      winsToUnlock: 10,
      maxBetAfter: 10,
      advanceBank: 200,
    },
    {
      startBank: 500,
      minBet: 5,
      winsToUnlock: 10,
      maxBetAfter: 25,
      advanceBank: 1000,
    },
    {
      startBank: 5000,
      minBet: 25,
      winsToUnlock: 10,
      maxBetAfter: 100,
      advanceBank: 10000,
    },
    {
      startBank: 50000,
      minBet: 100,
      winsToUnlock: 10,
      maxBetAfter: 1000,
      advanceBank: 100000,
      /** After unlock, allow these denominations (includes min and high chips). */
      denomsAfter: [100, 500, 1000],
    },
  ]

  const LADDER = Object.freeze([1, 5, 10, 25, 100, 500, 1000])

  function tableAt(i) {
    const n = i | 0
    if (n < 0 || n >= tables.length) return tables[0]
    return tables[n]
  }

  /**
   * Whether the player is still on “minimum bet only” for this table.
   */
  function isRestricted(tIdx, winsPhase1) {
    const T = tableAt(tIdx)
    const w = winsPhase1 | 0
    return w < T.winsToUnlock
  }

  /**
   * Max bet (chip value) allowed **right now** for this table + progress.
   */
  function maxBetFor(tIdx, winsPhase1) {
    const T = tableAt(tIdx)
    return isRestricted(tIdx, winsPhase1) ? T.minBet : T.maxBetAfter
  }

  /**
   * Chip denominations available for betting at this table + progress.
   */
  function chipDenomsFor(tIdx, winsPhase1) {
    const T = tableAt(tIdx)
    if (isRestricted(tIdx, winsPhase1)) return [T.minBet]
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
    { id: 1, name: 'Club Classic', prize: 'Big-screen TV', minTable: 0, minHands: 12, minWon: 50 },
    { id: 2, name: 'Skyline Open', prize: 'Laptop & gear', minTable: 0, minHands: 28, minWon: 500 },
    { id: 3, name: 'Premium Gala', prize: 'Jewelry & watch', minTable: 1, minHands: 55, minWon: 1800 },
    { id: 4, name: 'Elite Showcase', prize: 'Sports car weekend', minTable: 1, minHands: 90, minWon: 4000 },
    { id: 5, name: 'High Roller Cup', prize: 'Yacht charter', minTable: 2, minHands: 125, minWon: 6500 },
    { id: 6, name: 'Grand Invitational', prize: 'Dream garage & collection', minTable: 3, minHands: 180, minWon: 8500 },
  ]

  const tournamentWinsToClinch = 2

  window.__d21Rules = {
    version: 2,
    tables,
    tournaments,
    tournamentWinsToClinch,
    ladder: LADDER,
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
      return maxBetFor(ti, w1)
    }
    return 5
  }

  window.__d21RulesStakeProgressPaths = function () {
    return []
  }
})()
