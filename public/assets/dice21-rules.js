/**
 * Dice 21 — tunable game rules (single source of truth for balance).
 *
 * Load order: include this script before `main-BosaNfoM.js` / tournaments
 * (see `dice-21/index.html`). Edit values here and refresh — no need to
 * hunt through the minified main bundle.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  /**
   * @typedef {{ maxBet: number, paths: [hands: number, lifetimePotWon: number][] }} StakeTierRule
   * Stake tiers are checked from highest `maxBet` first. Within a tier, any ONE
   * path may match (OR). Within a path, BOTH hands and $ won must be met (AND).
   */
  const stakeTiers = [
    {
      maxBet: 100,
      paths: [
        [200, 8000],
        [120, 9500],
        [140, 7200],
      ],
    },
    {
      maxBet: 25,
      paths: [
        [60, 2000],
        [38, 2400],
        [70, 1800],
      ],
    },
    {
      maxBet: 5,
      paths: [
        [12, 50],
        [8, 72],
        [22, 40],
      ],
    },
  ]

  /**
   * Progress meter / “closest path” toward the *next* max bet.
   * Keys are current achieved max bet (1, 5, or 25). Each value is a list of
   * [hands, $ won] paths (same OR-of-AND semantics as stake tiers).
   */
  const stakeProgressTowardNext = {
    1: [
      [12, 50],
      [8, 72],
      [22, 40],
    ],
    5: [
      [60, 2000],
      [38, 2400],
      [70, 1800],
    ],
    25: [
      [200, 8000],
      [120, 9500],
      [140, 7200],
    ],
  }

  /** Career tournaments (gates: max-bet tier + hands + lifetime $ won). */
  const tournaments = [
    { id: 1, name: 'Club Classic', prize: 'Big-screen TV', tierMin: 5, minHands: 12, minWon: 50 },
    { id: 2, name: 'Skyline Open', prize: 'Laptop & gear', tierMin: 5, minHands: 28, minWon: 500 },
    { id: 3, name: 'Premium Gala', prize: 'Jewelry & watch', tierMin: 25, minHands: 55, minWon: 1800 },
    { id: 4, name: 'Elite Showcase', prize: 'Sports car weekend', tierMin: 25, minHands: 90, minWon: 4000 },
    { id: 5, name: 'High Roller Cup', prize: 'Yacht charter', tierMin: 100, minHands: 125, minWon: 6500 },
    { id: 6, name: 'Grand Invitational', prize: 'Dream garage & collection', tierMin: 100, minHands: 180, minWon: 8500 },
  ]

  /** Series length for tournament mini-games (first to N wins). */
  const tournamentWinsToClinch = 2

  window.__d21Rules = {
    version: 1,
    stakeTiers,
    stakeProgressTowardNext,
    tournaments,
    tournamentWinsToClinch,
  }

  /**
   * @param {number} h lifetime hands
   * @param {number} w lifetime pot $ won (not net profit)
   * @returns {1|5|25|100}
   */
  window.__d21RulesStakeTierMax = function (h, w) {
    const hi = h | 0
    const wi = w | 0
    for (const tier of stakeTiers) {
      for (let i = 0; i < tier.paths.length; i++) {
        const path = tier.paths[i]
        const H = path[0]
        const W = path[1]
        if (hi >= H && wi >= W) return tier.maxBet
      }
    }
    return 1
  }

  /**
   * Paths for the stake meter toward the next tier.
   * @param {number} achievedMax current d21StakeTierFromStats() (1, 5, 25, or 100)
   * @returns {[number, number][]}
   */
  window.__d21RulesStakeProgressPaths = function (achievedMax) {
    if (achievedMax >= 100) return []
    const key = achievedMax === 1 ? 1 : achievedMax === 5 ? 5 : achievedMax === 25 ? 25 : 1
    const p = stakeProgressTowardNext[key]
    return Array.isArray(p) && p.length ? p : stakeProgressTowardNext[1]
  }
})()
