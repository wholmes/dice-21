/**
 * Upper-left badge artwork — syncs with dice21_achievements_v1 and game __d21Ach.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const ACH_KEY = 'dice21_achievements_v1'
  const BADGE_GRID_VERSION = '18'

  const ORDER = [
    'green_table',
    'first_blood',
    'one_chip',
    'club_member',
    'sharp_shooter',
    'cool_hand',
    'fortune_smile',
    'lucky_7',
    'house_bust',
    'on_heater',
    'blackjack_soul',
    'double_dare',
    'push_master',
    'push_sage',
    'premium_player',
    'elite_player',
    'high_roller',
    'century_club',
  ]

  const LABELS = {
    green_table: 'Green felt',
    first_blood: 'First blood',
    one_chip: 'One-chip wonder',
    club_member: 'Club member',
    sharp_shooter: 'Sharp shooter',
    cool_hand: 'Cool hand',
    fortune_smile: 'Fortune smile',
    lucky_7: 'Lucky seven',
    house_bust: 'House bust',
    on_heater: 'On a heater',
    blackjack_soul: 'Blackjack soul',
    double_dare: 'Double dare',
    push_master: 'Push master',
    push_sage: 'Push sage',
    premium_player: 'Premium player',
    elite_player: 'Elite player',
    high_roller: 'High roller',
    century_club: 'Century club',
  }

  /** Tooltip when locked — do not reveal badge name/art until earned */
  const LOCKED_TITLE = 'Locked — unlock through play (see Badges in panel)'

  function placeholderSvg() {
    return (
      '<svg class="d21-badge-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>' +
      '<circle cx="32" cy="32" r="10" fill="rgba(255,255,255,0.05)"/>' +
      '<text x="32" y="40" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-family="system-ui,sans-serif" font-size="20" font-weight="700">?</text>' +
      '</svg>'
    )
  }

  /** @type {Set<string>} */
  let prevUnlocked = new Set()
  let inited = false

  function readUnlocked() {
    try {
      if (window.__d21Ach && Array.isArray(window.__d21Ach.unlocked)) {
        return window.__d21Ach.unlocked.slice()
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(ACH_KEY)
      if (!raw) return []
      const j = JSON.parse(raw)
      return Array.isArray(j.u) ? j.u : []
    } catch {
      return []
    }
  }

  function iconSvg(id) {
    const uid = id.replace(/[^a-z0-9]/gi, '')
    const g = (inner) =>
      `<svg class="d21-badge-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`
    switch (id) {
      case 'green_table':
        return g(
          `<rect x="8" y="14" width="48" height="36" rx="4" fill="#1e4d3a" stroke="#3d8c6a" stroke-width="1.5"/><path d="M14 22h36M14 30h36M14 38h24" stroke="rgba(255,255,255,0.12)" stroke-width="1"/><circle cx="32" cy="32" r="5" fill="none" stroke="#c9a86a" stroke-width="1.5"/>`,
        )
      case 'one_chip':
        return g(
          `<defs><linearGradient id="g${uid}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8d5a8"/><stop offset="100%" stop-color="#8a6f3d"/></linearGradient></defs><ellipse cx="32" cy="40" rx="14" ry="5" fill="#2a2435"/><ellipse cx="32" cy="36" rx="14" ry="5" fill="url(#g${uid}g)"/><ellipse cx="32" cy="32" rx="14" ry="5" fill="url(#g${uid}g)"/><text x="32" y="35" text-anchor="middle" fill="#1a1510" font-family="system-ui,sans-serif" font-size="9" font-weight="800">1</text>`,
        )
      case 'club_member':
        return g(
          `<path fill="#3d6b4a" d="M32 12c-4 0-8 4-8 10 0 6 4 10 8 14 4-4 8-8 8-14 0-6-4-10-8-10z"/><circle cx="26" cy="22" r="5" fill="#2d5a40"/><circle cx="38" cy="22" r="5" fill="#2d5a40"/><circle cx="32" cy="16" r="5" fill="#2d5a40"/><path fill="#2d5a40" d="M32 28v12c-4 2-6 6-6 10h12c0-4-2-8-6-10z"/>`,
        )
      case 'sharp_shooter':
        return g(
          `<path fill="#c45c5c" d="M32 8l4 14h14l-11 8 4 14-11-9-11 9 4-14-11-8h14z"/>`,
        )
      case 'cool_hand':
        return g(
          `<circle cx="32" cy="32" r="20" fill="#1e3a4a" stroke="#5ab0d0" stroke-width="2"/><path fill="none" stroke="#a8e0ff" stroke-width="1.5" d="M22 28c4-6 12-6 16 0M24 36c4 4 12 4 16 0"/>`,
        )
      case 'fortune_smile':
        return g(
          `<circle cx="32" cy="32" r="22" fill="#2a2435" stroke="#f0d78c" stroke-width="1.5"/><text x="32" y="38" text-anchor="middle" fill="#f0d78c" font-family="Georgia,serif" font-size="16" font-weight="700">21</text><path fill="#4ade80" d="M18 44h28v4H18z" opacity="0.9"/>`,
        )
      case 'lucky_7':
        return g(
          `<circle cx="32" cy="32" r="22" fill="#1a1e28" stroke="#c9a86a" stroke-width="2"/><text x="32" y="42" text-anchor="middle" fill="#f4ecd8" font-family="Georgia,serif" font-size="28" font-weight="700">7</text>`,
        )
      case 'house_bust':
        return g(
          `<path fill="#4a5568" d="M20 38 L32 18 L44 38 Z"/><rect x="26" y="38" width="12" height="14" fill="#3d4856"/><path stroke="#f0b8c0" stroke-width="2" d="M24 28l16 16M40 28L24 44"/>`,
        )
      case 'push_sage':
        return g(
          `<defs><radialGradient id="g${uid}ps" cx="30%" cy="25%" r="70%"><stop offset="0%" stop-color="#5a6a82"/><stop offset="100%" stop-color="#1a2230"/></radialGradient></defs><circle cx="32" cy="32" r="26" fill="url(#g${uid}ps)" stroke="#c9a86a" stroke-width="1.5"/><text x="32" y="38" text-anchor="middle" fill="#e8dcc4" font-family="Georgia,serif" font-size="14" font-weight="700">25</text><text x="32" y="50" text-anchor="middle" fill="#8a9aaf" font-family="system-ui,sans-serif" font-size="7" font-weight="600">PUSH</text>`,
        )
      case 'premium_player':
        return g(
          `<rect x="12" y="20" width="40" height="24" rx="3" fill="linear-gradient(180deg,#c0c8d8,#8890a0)" fill="#a8b0c0" stroke="#e8ecf4" stroke-width="1.5"/><text x="32" y="36" text-anchor="middle" fill="#2a3040" font-family="system-ui,sans-serif" font-size="11" font-weight="800">25</text>`,
        )
      case 'elite_player':
        return g(
          `<defs><linearGradient id="g${uid}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffeaa7"/><stop offset="100%" stop-color="#d4a017"/></linearGradient></defs><path fill="url(#g${uid}c)" d="M32 10l6 8 10 2-8 8 2 12-10-6-10 6 2-12-8-8 10-2z"/><text x="32" y="38" text-anchor="middle" fill="#1a1510" font-family="Georgia,serif" font-size="10" font-weight="700">100</text>`,
        )
      case 'century_club':
        return g(
          `<circle cx="32" cy="32" r="24" fill="#1e2430" stroke="#6b7a94" stroke-width="2"/><text x="32" y="30" text-anchor="middle" fill="#c8d4e8" font-family="Georgia,serif" font-size="11" font-weight="700">100</text><text x="32" y="44" text-anchor="middle" fill="#6a7a92" font-family="system-ui,sans-serif" font-size="7">hands</text>`,
        )
      case 'first_blood':
        return g(
          `<defs><linearGradient id="g${uid}a" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f08080"/><stop offset="100%" stop-color="#8b1538"/></linearGradient></defs><path fill="url(#g${uid}a)" d="M32 6c-4 12-14 18-14 28 0 10 8 16 14 22 6-6 14-12 14-22 0-10-10-16-14-28z"/><ellipse cx="32" cy="26" fill="rgba(255,255,255,0.35)" rx="6" ry="4"/>`,
        )
      case 'on_heater':
        return g(
          `<defs><linearGradient id="g${uid}a" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ff6b35"/><stop offset="50%" stop-color="#ffc857"/><stop offset="100%" stop-color="#fff5cc"/></linearGradient></defs><path fill="url(#g${uid}a)" d="M32 52c-8-6-10-16-6-24 2-4 6-6 6-14 4 4 6 10 6 16 0 8-4 16-6 22z"/><path fill="url(#g${uid}a)" opacity="0.85" d="M18 48c-4-8-2-14 2-20 3 6 4 12 2 18l-4 2z"/><path fill="url(#g${uid}a)" opacity="0.85" d="M46 48c4-8 2-14-2-20-3 6-4 12-2 18l4 2z"/>`,
        )
      case 'blackjack_soul':
        return g(
          '<path fill="#1a1e28" d="M32 8l6 10 10 2-8 8 2 12-10-6-10 6 2-12-8-8 10-2z"/><text x="32" y="40" text-anchor="middle" fill="#f0d78c" font-family="Georgia,serif" font-size="14" font-weight="700">21</text>',
        )
      case 'double_dare':
        return g(
          '<g stroke="#c9a86a" stroke-width="1.5" fill="#f4ecd8"><rect x="8" y="26" width="20" height="20" rx="4"/><rect x="36" y="22" width="20" height="20" rx="4"/></g><circle cx="18" cy="36" r="2.5" fill="#1a1e28"/><circle cx="46" cy="32" r="2.5" fill="#1a1e28"/><path d="M24 36h16" stroke="#c49a3c" stroke-width="2" stroke-linecap="round"/>',
        )
      case 'push_master':
        return g(
          `<defs>
            <radialGradient id="g${uid}bg" cx="28%" cy="22%" r="78%">
              <stop offset="0%" stop-color="#4a6078"/>
              <stop offset="50%" stop-color="#283240"/>
              <stop offset="100%" stop-color="#121820"/>
            </radialGradient>
            <linearGradient id="g${uid}gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f2e8cc"/>
              <stop offset="40%" stop-color="#c9a86a"/>
              <stop offset="100%" stop-color="#7d6238"/>
            </linearGradient>
            <linearGradient id="g${uid}rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#e8d5a8"/>
              <stop offset="50%" stop-color="#a88952"/>
              <stop offset="100%" stop-color="#5c4a2a"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#g${uid}bg)" stroke="url(#g${uid}rim)" stroke-width="1.75"/>
          <circle cx="32" cy="32" r="23.5" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
          <g transform="translate(0 -5)">
            <g fill="url(#g${uid}gold)">
              <ellipse cx="20" cy="38" rx="5.5" ry="2.35"/>
              <ellipse cx="20" cy="34" rx="5.5" ry="2.35"/>
              <ellipse cx="20" cy="30" rx="5.5" ry="2.35"/>
              <ellipse cx="20" cy="26" rx="5.5" ry="2.35"/>
            </g>
            <g fill="url(#g${uid}gold)">
              <ellipse cx="44" cy="38" rx="5.5" ry="2.35"/>
              <ellipse cx="44" cy="34" rx="5.5" ry="2.35"/>
              <ellipse cx="44" cy="30" rx="5.5" ry="2.35"/>
              <ellipse cx="44" cy="26" rx="5.5" ry="2.35"/>
            </g>
            <ellipse cx="17.5" cy="25" rx="2.2" ry="1" fill="rgba(255,255,255,0.28)"/>
            <ellipse cx="46.5" cy="25" rx="2.2" ry="1" fill="rgba(255,255,255,0.28)"/>
            <rect x="24.5" y="26.5" width="15" height="3.2" rx="1" fill="#f4ecdc"/>
            <rect x="24.5" y="32.3" width="15" height="3.2" rx="1" fill="#f4ecdc"/>
            <text x="32" y="52.5" text-anchor="middle" fill="#e8dcc4" font-family="Georgia,serif" font-size="9.5" font-weight="700" letter-spacing="0.14em">PUSH</text>
          </g>`,
        )
      case 'high_roller':
        return g(
          '<ellipse cx="32" cy="48" rx="18" ry="6" fill="#2a2435"/><rect x="22" y="18" width="20" height="8" rx="2" fill="#c45c5c"/><rect x="24" y="26" width="16" height="8" rx="2" fill="#3d6b4a"/><rect x="26" y="34" width="12" height="8" rx="2" fill="#2a4d8c"/><rect x="28" y="42" width="8" height="6" rx="1" fill="#f0d78c"/>',
        )
      default:
        return g('<circle cx="32" cy="32" r="20" fill="#2a2e3c" stroke="#5a6270"/>')
    }
  }

  function render() {
    const grid = document.getElementById('d21BadgeGrid')
    if (!grid) return

    const unlocked = new Set(readUnlocked())

    if (!grid.dataset.built || grid.dataset.badgeVer !== BADGE_GRID_VERSION) {
      grid.innerHTML = ORDER.map((id) => {
        return `<div class="d21-badge-slot" data-badge="${id}" title="${LOCKED_TITLE}">
          <span class="d21-badge-slot__frame">${placeholderSvg()}</span>
          <span class="d21-badge-slot__lock" aria-hidden="true">🔒</span>
        </div>`
      }).join('')
      grid.dataset.built = '1'
      grid.dataset.badgeVer = BADGE_GRID_VERSION
    }

    ORDER.forEach((id) => {
      const el = grid.querySelector(`[data-badge="${id}"]`)
      if (!el) return
      const on = unlocked.has(id)
      const frame = el.querySelector('.d21-badge-slot__frame')
      if (frame) {
        frame.innerHTML = on ? iconSvg(id) : placeholderSvg()
      }
      el.setAttribute('title', on ? LABELS[id] || id : LOCKED_TITLE)
      el.classList.toggle('d21-badge-slot--on', on)
      el.classList.toggle('d21-badge-slot--off', !on)
      if (inited && on && !prevUnlocked.has(id)) {
        el.classList.remove('d21-badge-slot--pop')
        void el.offsetWidth
        el.classList.add('d21-badge-slot--pop')
        window.setTimeout(() => el.classList.remove('d21-badge-slot--pop'), 1400)
      }
    })

    prevUnlocked = new Set(unlocked)
    inited = true
  }

  window.d21BadgeShowcaseRefresh = render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render)
  } else {
    render()
  }
})()
