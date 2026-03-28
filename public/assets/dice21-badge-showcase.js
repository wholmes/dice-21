/**
 * Upper-left badge artwork — syncs with dice21_achievements_v1 and game __d21Ach.
 *
 * Dev — show every badge’s art (ignore unlock state):
 *   • URL: ?d21badges=all or ?d21badges=1
 *   • localStorage: d21_show_all_badges = 1
 *   • JS before load: window.__D21_SHOW_ALL_BADGES__ = true
 *   • After load: d21BadgeArtworkPreview(true)  // then d21BadgeArtworkPreview(false) to clear
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const ACH_KEY = 'dice21_achievements_v1'
  const LS_PREVIEW = 'd21_show_all_badges'
  const BADGE_GRID_VERSION = '53'

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

  /** Corner micro-stars twinkle when unlocked — club_member, on_heater, elite_player, high_roller, blackjack_soul */
  const PREMIUM_ANIM_BADGE_IDS = new Set([
    'club_member',
    'on_heater',
    'elite_player',
    'high_roller',
    'blackjack_soul',
  ])

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

  function isBadgesArtworkPreview() {
    try {
      if (typeof window !== 'undefined' && window.__D21_SHOW_ALL_BADGES__ === true) return true
      if (typeof location !== 'undefined') {
        const q = new URLSearchParams(location.search).get('d21badges')
        if (q === 'all' || q === '1') return true
      }
      if (typeof localStorage !== 'undefined' && localStorage.getItem(LS_PREVIEW) === '1') return true
    } catch {
      /* ignore */
    }
    return false
  }

  function syncPreviewChrome(on) {
    const root = document.getElementById('d21BadgeShowcase')
    if (!root) return
    root.classList.toggle('d21-badge-showcase--dev-preview', on)
    root.setAttribute('aria-label', on ? 'Badges — artwork preview (dev)' : 'Earned badges')
    const t = document.querySelector('.d21-badge-showcase-title')
    if (t) t.textContent = on ? 'Badges · preview' : 'Badges'
  }

  function readUnlocked() {
    if (isBadgesArtworkPreview()) return ORDER.slice()
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

  /** Same three micro-stars as Blackjack soul corners — CSS animates when .d21-badge-slot--premium */
  function bjCornerSparklesHtml() {
    return `<g class="d21-badge-sparkles" fill="#eaf6ec" opacity="0.9" aria-hidden="true">
      <path stroke="rgba(18,40,32,0.35)" stroke-width="0.12" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M12 18l1.1 2.4 2.6.4-1.9 1.8.5 2.7-2.3-1.2-2.3 1.2.5-2.7-1.9-1.8 2.6-.4z"/>
      <path stroke="rgba(18,40,32,0.35)" stroke-width="0.12" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M52 16l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>
      <path stroke="rgba(18,40,32,0.35)" stroke-width="0.12" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M48 46l.7 1.5 1.7.2-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.2z"/>
    </g>`
  }

  function iconSvg(id) {
    const uid = id.replace(/[^a-z0-9]/gi, '')
    const g = (inner) =>
      `<svg class="d21-badge-icon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`
    switch (id) {
      case 'green_table':
        /* Same felt-chip look as one_chip (grain + rim), no denomination */
        return g(
          `<defs>
            <clipPath id="g${uid}felt"><circle cx="32" cy="32" r="18.4"/></clipPath>
            <filter id="g${uid}grain" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="4" seed="21" result="n"/>
              <feColorMatrix in="n" type="luminanceToAlpha" result="la"/>
              <feComponentTransfer in="la" result="mask">
                <feFuncA type="linear" slope="0.32" intercept="0"/>
              </feComponentTransfer>
              <feFlood flood-color="#031a12" flood-opacity="1" result="f"/>
              <feComposite in="f" in2="mask" operator="in" result="grain"/>
              <feBlend in="SourceGraphic" in2="grain" mode="multiply" result="out"/>
            </filter>
            <radialGradient id="g${uid}rim" cx="34%" cy="30%" r="95%">
              <stop offset="0%" stop-color="#faf2dc"/>
              <stop offset="28%" stop-color="#e8c878"/>
              <stop offset="58%" stop-color="#b08038"/>
              <stop offset="88%" stop-color="#5c3c18"/>
              <stop offset="100%" stop-color="#2c1810"/>
            </radialGradient>
            <linearGradient id="g${uid}band" x1="8%" y1="8%" x2="92%" y2="92%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="22%" stop-color="#d4a848"/>
              <stop offset="55%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}face" cx="36%" cy="32%" r="82%">
              <stop offset="0%" stop-color="#5cb896"/>
              <stop offset="18%" stop-color="#3a9a72"/>
              <stop offset="42%" stop-color="#267a58"/>
              <stop offset="68%" stop-color="#1a5d42"/>
              <stop offset="100%" stop-color="#0c3024"/>
            </radialGradient>
            <linearGradient id="g${uid}nap" x1="12%" y1="10%" x2="88%" y2="92%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
              <stop offset="35%" stop-color="#ffffff" stop-opacity="0.02"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
            </linearGradient>
            <radialGradient id="g${uid}shade" cx="72%" cy="78%" r="58%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
              <stop offset="70%" stop-color="#000000" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
            </radialGradient>
            <filter id="g${uid}soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2"/>
            </filter>
          </defs>
          <ellipse cx="32" cy="36.5" rx="22" ry="3.2" fill="#000" opacity="0.22" filter="url(#g${uid}soft)"/>
          <circle cx="32" cy="32" r="26" fill="url(#g${uid}rim)" stroke="url(#g${uid}band)" stroke-width="1.9"/>
          <circle cx="32" cy="32" r="23.2" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="0.85"/>
          <circle cx="32" cy="32" r="22.2" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.45"/>
          <g clip-path="url(#g${uid}felt)" filter="url(#g${uid}grain)">
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}face)"/>
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}nap)"/>
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}shade)"/>
          </g>
          <circle cx="32" cy="32" r="18.4" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="16.6" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="0.4"/>
          <ellipse cx="23" cy="21" rx="9" ry="5.5" fill="rgba(255,255,255,0.09)" transform="rotate(-28 23 21)"/>`,
        )
      case 'one_chip':
        return g(
          `<defs>
            <clipPath id="g${uid}felt"><circle cx="32" cy="32" r="18.4"/></clipPath>
            <filter id="g${uid}grain" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="4" seed="17" result="n"/>
              <feColorMatrix in="n" type="luminanceToAlpha" result="la"/>
              <feComponentTransfer in="la" result="mask">
                <feFuncA type="linear" slope="0.32" intercept="0"/>
              </feComponentTransfer>
              <feFlood flood-color="#031a12" flood-opacity="1" result="f"/>
              <feComposite in="f" in2="mask" operator="in" result="grain"/>
              <feBlend in="SourceGraphic" in2="grain" mode="multiply" result="out"/>
            </filter>
            <radialGradient id="g${uid}rim" cx="34%" cy="30%" r="95%">
              <stop offset="0%" stop-color="#faf2dc"/>
              <stop offset="28%" stop-color="#e8c878"/>
              <stop offset="58%" stop-color="#b08038"/>
              <stop offset="88%" stop-color="#5c3c18"/>
              <stop offset="100%" stop-color="#2c1810"/>
            </radialGradient>
            <linearGradient id="g${uid}band" x1="8%" y1="8%" x2="92%" y2="92%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="22%" stop-color="#d4a848"/>
              <stop offset="55%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}face" cx="36%" cy="32%" r="82%">
              <stop offset="0%" stop-color="#5cb896"/>
              <stop offset="18%" stop-color="#3a9a72"/>
              <stop offset="42%" stop-color="#267a58"/>
              <stop offset="68%" stop-color="#1a5d42"/>
              <stop offset="100%" stop-color="#0c3024"/>
            </radialGradient>
            <linearGradient id="g${uid}nap" x1="12%" y1="10%" x2="88%" y2="92%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
              <stop offset="35%" stop-color="#ffffff" stop-opacity="0.02"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
            </linearGradient>
            <radialGradient id="g${uid}shade" cx="72%" cy="78%" r="58%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
              <stop offset="70%" stop-color="#000000" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
            </radialGradient>
            <filter id="g${uid}soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2"/>
            </filter>
          </defs>
          <ellipse cx="32" cy="36.5" rx="22" ry="3.2" fill="#000" opacity="0.22" filter="url(#g${uid}soft)"/>
          <circle cx="32" cy="32" r="26" fill="url(#g${uid}rim)" stroke="url(#g${uid}band)" stroke-width="1.9"/>
          <circle cx="32" cy="32" r="23.2" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="0.85"/>
          <circle cx="32" cy="32" r="22.2" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.45"/>
          <g clip-path="url(#g${uid}felt)" filter="url(#g${uid}grain)">
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}face)"/>
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}nap)"/>
            <circle cx="32" cy="32" r="18.4" fill="url(#g${uid}shade)"/>
          </g>
          <circle cx="32" cy="32" r="18.4" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="16.6" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="0.4"/>
          <ellipse cx="23" cy="21" rx="9" ry="5.5" fill="rgba(255,255,255,0.09)" transform="rotate(-28 23 21)"/>
          <text x="32" y="37.5" text-anchor="middle" fill="#f8f4e8" stroke="rgba(0,0,0,0.28)" stroke-width="0.6" paint-order="stroke fill" font-family="system-ui,sans-serif" font-size="16" font-weight="800">1</text>`,
        )
      case 'club_member':
        /* Playing-card ♣ — single path (Bootstrap Icons suit-club-fill, MIT), not overlapping circles */
        return g(
          `<defs>
            <linearGradient id="g${uid}clrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}clin" cx="48%" cy="38%" r="78%">
              <stop offset="0%" stop-color="#2d7a52"/>
              <stop offset="50%" stop-color="#1a4a34"/>
              <stop offset="100%" stop-color="#081810"/>
            </radialGradient>
            <linearGradient id="g${uid}clubs" x1="28%" y1="12%" x2="72%" y2="88%">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="40%" stop-color="#f0e0c0"/>
              <stop offset="100%" stop-color="#886028"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}clrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}clin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="24" rx="12" ry="6" fill="rgba(255,255,255,0.05)"/>
          <g transform="translate(32 31) scale(1.62) translate(-8 -8)">
            <path fill="url(#g${uid}clubs)" stroke="#1a1408" stroke-width="0.45" stroke-linejoin="round" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M11.5 12.5a3.493 3.493 0 0 1-2.684-1.254 19.92 19.92 0 0 0 1.582 2.907c.231.35-.02.847-.438.847H6.04c-.419 0-.67-.497-.438-.847a19.919 19.919 0 0 0 1.582-2.907 3.5 3.5 0 1 1-2.538-5.743 3.5 3.5 0 1 1 6.708 0A3.5 3.5 0 1 1 11.5 12.5z"/>
            <ellipse cx="8.2" cy="7.8" rx="2.2" ry="1.2" fill="rgba(255,255,255,0.32)" transform="rotate(-26 8.2 7.8)"/>
          </g>${bjCornerSparklesHtml()}`,
        )
      case 'sharp_shooter':
        return g(
          `<defs>
            <linearGradient id="g${uid}ssrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}ssin" cx="48%" cy="42%" r="72%">
              <stop offset="0%" stop-color="#3a4555"/>
              <stop offset="55%" stop-color="#1c222c"/>
              <stop offset="100%" stop-color="#080a0e"/>
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}ssrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}ssin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.38)" stroke-width="0.8"/>
          <circle cx="32" cy="32" r="15" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="0.85"/>
          <circle cx="32" cy="32" r="10.5" fill="none" stroke="#c45c5c" stroke-width="1.15"/>
          <circle cx="32" cy="32" r="6" fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="0.7"/>
          <circle cx="32" cy="32" r="2.8" fill="none" stroke="rgba(200,210,225,0.5)" stroke-width="0.55"/>
          <line x1="32" y1="13.5" x2="32" y2="23.5" stroke="#dce4f0" stroke-width="1.25" stroke-linecap="round"/>
          <line x1="32" y1="40.5" x2="32" y2="50.5" stroke="#dce4f0" stroke-width="1.25" stroke-linecap="round"/>
          <line x1="13.5" y1="32" x2="23.5" y2="32" stroke="#dce4f0" stroke-width="1.25" stroke-linecap="round"/>
          <line x1="40.5" y1="32" x2="50.5" y2="32" stroke="#dce4f0" stroke-width="1.25" stroke-linecap="round"/>
          <circle cx="32" cy="32" r="1.6" fill="#f0d78c" stroke="#2a1810" stroke-width="0.35"/>
          <g fill="rgba(255,255,255,0.7)">
            <circle cx="32" cy="14.2" r="1.35"/>
            <circle cx="49.8" cy="32" r="1.35"/>
            <circle cx="32" cy="49.8" r="1.35"/>
            <circle cx="14.2" cy="32" r="1.35"/>
          </g>`,
        )
      case 'cool_hand':
        /* Fanned card hand + cool teal — poker “hand”, not a face */
        return g(
          `<defs>
            <linearGradient id="g${uid}chrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}chin" cx="45%" cy="40%" r="80%">
              <stop offset="0%" stop-color="#2a7890"/>
              <stop offset="48%" stop-color="#1a4a5c"/>
              <stop offset="100%" stop-color="#060c12"/>
            </radialGradient>
            <linearGradient id="g${uid}chcard" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f4fafc"/>
              <stop offset="45%" stop-color="#d8e8f0"/>
              <stop offset="100%" stop-color="#88b8c8"/>
            </linearGradient>
            <linearGradient id="g${uid}chedge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#a0e8ff"/>
              <stop offset="100%" stop-color="#3088a8"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}chrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}chin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="34" rx="15" ry="12" fill="rgba(120,200,220,0.08)"/>
          <g transform="translate(32 42)">
            <g transform="rotate(-16)">
              <rect x="-6.5" y="-20" width="13" height="20" rx="2" fill="rgba(0,0,0,0.35)" transform="translate(0.5 0.6)"/>
              <rect x="-7" y="-20.5" width="14" height="21" rx="2.1" fill="url(#g${uid}chcard)" stroke="#1a3040" stroke-width="0.5"/>
              <path d="M-5 -17 H5 M-5 -14 H5 M-5 -11 H4" stroke="rgba(40,80,100,0.2)" stroke-width="0.45" stroke-linecap="round"/>
            </g>
            <g transform="rotate(16)">
              <rect x="-6.5" y="-20" width="13" height="20" rx="2" fill="rgba(0,0,0,0.32)" transform="translate(0.5 0.6)"/>
              <rect x="-7" y="-20.5" width="14" height="21" rx="2.1" fill="url(#g${uid}chcard)" stroke="#1a3040" stroke-width="0.5"/>
              <path d="M-5 -17 H5 M-5 -14 H5 M-5 -11 H4" stroke="rgba(40,80,100,0.2)" stroke-width="0.45" stroke-linecap="round"/>
            </g>
            <g transform="rotate(0)">
              <rect x="-6.5" y="-21" width="13" height="21" rx="2" fill="rgba(0,0,0,0.28)" transform="translate(0.45 0.55)"/>
              <rect x="-7" y="-21.5" width="14" height="22" rx="2.1" fill="url(#g${uid}chcard)" stroke="url(#g${uid}chedge)" stroke-width="0.65"/>
              <ellipse cx="0" cy="-16" rx="4" ry="2.2" fill="rgba(255,255,255,0.45)"/>
            </g>
          </g>`,
        )
      case 'fortune_smile':
        return g(
          `<defs>
            <linearGradient id="g${uid}fsrim" x1="18%" y1="12%" x2="82%" y2="88%">
              <stop offset="0%" stop-color="#fff8e8"/>
              <stop offset="35%" stop-color="#e8c468"/>
              <stop offset="70%" stop-color="#9a7028"/>
              <stop offset="100%" stop-color="#4a2810"/>
            </linearGradient>
            <radialGradient id="g${uid}fsin" cx="38%" cy="30%" r="78%">
              <stop offset="0%" stop-color="#4a3868"/>
              <stop offset="42%" stop-color="#2a1c40"/>
              <stop offset="100%" stop-color="#100818"/>
            </radialGradient>
            <linearGradient id="g${uid}fsgl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fffef0"/>
              <stop offset="45%" stop-color="#f0d78c"/>
              <stop offset="100%" stop-color="#a87828"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}fsrim)" stroke="#2a1810" stroke-width="0.6"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.5"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}fsin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="26" rx="14" ry="8" fill="rgba(255,255,255,0.04)"/>
          <g fill="#f8ecc8" opacity="0.9">
            <path d="M12 18l1.1 2.4 2.6.4-1.9 1.8.5 2.7-2.3-1.2-2.3 1.2.5-2.7-1.9-1.8 2.6-.4z"/>
            <path d="M52 16l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>
            <path d="M48 46l.7 1.5 1.7.2-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.2z"/>
          </g>
          <circle cx="23.5" cy="27" r="2.4" fill="url(#g${uid}fsgl)" stroke="#2a1810" stroke-width="0.35"/>
          <circle cx="40.5" cy="27" r="2.4" fill="url(#g${uid}fsgl)" stroke="#2a1810" stroke-width="0.35"/>
          <ellipse cx="23.5" cy="26.2" rx="0.9" ry="0.55" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="40.5" cy="26.2" rx="0.9" ry="0.55" fill="rgba(255,255,255,0.55)"/>
          <text x="32" y="39.5" text-anchor="middle" fill="url(#g${uid}fsgl)" stroke="#1a0e08" stroke-width="0.45" paint-order="stroke fill" font-family="Georgia,serif" font-size="17" font-weight="700">21</text>
          <path d="M17.5 45.5 Q32 58.5 46.5 45.5" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M17.5 45.5 Q32 58.5 46.5 45.5" fill="none" stroke="#f0d78c" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M18 45.2 Q32 57.2 46 45.2" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.9" stroke-linecap="round"/>`,
        )
      case 'lucky_7':
        return g(
          `<defs>
            <linearGradient id="g${uid}l7rim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}l7in" cx="35%" cy="32%" r="75%">
              <stop offset="0%" stop-color="#1a3d32"/>
              <stop offset="55%" stop-color="#0d221c"/>
              <stop offset="100%" stop-color="#050a08"/>
            </radialGradient>
            <linearGradient id="g${uid}l7num" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="35%" stop-color="#f8e8b8"/>
              <stop offset="100%" stop-color="#d4a848"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}l7rim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}l7in)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.85"/>
          <g stroke="rgba(255,255,255,0.1)" stroke-width="1.1" stroke-linecap="round">
            <line x1="32" y1="14" x2="32" y2="20"/>
            <line x1="32" y1="44" x2="32" y2="50"/>
            <line x1="14" y1="32" x2="20" y2="32"/>
            <line x1="44" y1="32" x2="50" y2="32"/>
            <line x1="19.2" y1="19.2" x2="23.5" y2="23.5"/>
            <line x1="44.8" y1="19.2" x2="40.5" y2="23.5"/>
            <line x1="19.2" y1="44.8" x2="23.5" y2="40.5"/>
            <line x1="44.8" y1="44.8" x2="40.5" y2="40.5"/>
          </g>
          <g fill="#f4ecd8" opacity="0.88">
            <path d="M10 14l.9 2 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>
            <path d="M54 12l.8 1.7 2 .3-1.4 1.4.4 1.9-1.8-.9-1.8.9.4-1.9-1.4-1.4 2-.3z"/>
            <path d="M52 48l.6 1.3 1.6.2-1.1 1.1.3 1.6-1.4-.7-1.4.7.3-1.6-1.1-1.1 1.6-.2z"/>
          </g>
          <text x="32" y="40.5" text-anchor="middle" fill="url(#g${uid}l7num)" stroke="#1a0e06" stroke-width="0.55" paint-order="stroke fill" font-family="Georgia,serif" font-size="30" font-weight="700">7</text>
          <g>
            <rect x="18.5" y="47.5" width="9" height="9" rx="1.4" fill="#f4ecd8" stroke="#1a1e28" stroke-width="0.55"/>
            <circle cx="20.5" cy="49.5" r="1" fill="#1a1e28"/>
            <circle cx="23.5" cy="52" r="1" fill="#1a1e28"/>
            <circle cx="26.5" cy="54.5" r="1" fill="#1a1e28"/>
            <rect x="36.5" y="47.5" width="9" height="9" rx="1.4" fill="#f4ecd8" stroke="#1a1e28" stroke-width="0.55"/>
            <circle cx="38.5" cy="49.5" r="1" fill="#1a1e28"/>
            <circle cx="44.5" cy="49.5" r="1" fill="#1a1e28"/>
            <circle cx="38.5" cy="54.5" r="1" fill="#1a1e28"/>
            <circle cx="44.5" cy="54.5" r="1" fill="#1a1e28"/>
          </g>`,
        )
      case 'house_bust':
        /* Dealer bust: split hand — two card halves with a red “break” (no literal house) */
        return g(
          `<defs>
            <linearGradient id="g${uid}hbrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}hbin" cx="48%" cy="44%" r="82%">
              <stop offset="0%" stop-color="#4a2830"/>
              <stop offset="55%" stop-color="#241018"/>
              <stop offset="100%" stop-color="#080408"/>
            </radialGradient>
            <linearGradient id="g${uid}hbcard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#faf6f0"/>
              <stop offset="45%" stop-color="#e8e0d8"/>
              <stop offset="100%" stop-color="#c8c0b8"/>
            </linearGradient>
            <radialGradient id="g${uid}hbreak" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ff7060"/>
              <stop offset="70%" stop-color="#c02028"/>
              <stop offset="100%" stop-color="#501010"/>
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}hbrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}hbin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="33" rx="14" ry="11" fill="rgba(200,80,80,0.08)"/>
          <ellipse cx="32" cy="32" rx="5" ry="14" fill="url(#g${uid}hbreak)" opacity="0.95"/>
          <g transform="translate(32 32) rotate(-9) translate(-32 -32)">
            <rect x="15.5" y="19" width="14" height="26" rx="2.2" fill="rgba(0,0,0,0.35)" transform="translate(0.6 0.7)"/>
            <rect x="15" y="18.5" width="14" height="26" rx="2.2" fill="url(#g${uid}hbcard)" stroke="#1c1820" stroke-width="0.5"/>
            <ellipse cx="22" cy="24" rx="3.5" ry="2" fill="rgba(255,255,255,0.35)"/>
          </g>
          <g transform="translate(32 32) rotate(9) translate(-32 -32)">
            <rect x="35.5" y="19" width="14" height="26" rx="2.2" fill="rgba(0,0,0,0.35)" transform="translate(0.6 0.7)"/>
            <rect x="35" y="18.5" width="14" height="26" rx="2.2" fill="url(#g${uid}hbcard)" stroke="#1c1820" stroke-width="0.5"/>
            <ellipse cx="42" cy="24" rx="3.5" ry="2" fill="rgba(255,255,255,0.35)"/>
          </g>`,
        )
      case 'push_sage':
        /* Same hand silhouette as push_master; sage/teal field + green-tinted hand */
        return g(
          `<defs>
            <linearGradient id="g${uid}psgrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#eef6e8"/>
              <stop offset="28%" stop-color="#a8c4a8"/>
              <stop offset="68%" stop-color="#4a7058"/>
              <stop offset="100%" stop-color="#1a3020"/>
            </linearGradient>
            <radialGradient id="g${uid}psgin" cx="45%" cy="42%" r="82%">
              <stop offset="0%" stop-color="#5a9888"/>
              <stop offset="42%" stop-color="#2a5044"/>
              <stop offset="100%" stop-color="#081210"/>
            </radialGradient>
            <linearGradient id="g${uid}psghand" x1="30%" y1="15%" x2="70%" y2="85%">
              <stop offset="0%" stop-color="#f0f6f0"/>
              <stop offset="55%" stop-color="#c8dcc8"/>
              <stop offset="100%" stop-color="#7a9a82"/>
            </linearGradient>
            <linearGradient id="g${uid}pssprk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f4fff8"/>
              <stop offset="100%" stop-color="#88c898"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}psgrim)" stroke="#0e1812" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}psgin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <g fill="url(#g${uid}pssprk)" stroke="#1a3020" stroke-width="0.12" paint-order="stroke fill" aria-hidden="true">
            <path transform="translate(32 18.2) rotate(8) scale(0.52)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(43.4 25.8) rotate(52) scale(0.44)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(43.2 38.5) rotate(-28) scale(0.48)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(32 45.8) rotate(15) scale(0.5)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(20.6 38.5) rotate(-15) scale(0.42)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(20.8 25.8) rotate(35) scale(0.46)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
          </g>
          <g transform="translate(33.2 33.2) scale(0.162) translate(-128 -128)" opacity="0.35" aria-hidden="true">
            <path fill="#040807" d="M216,64v90.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,72.6,215.4C50.79,192.33,26.15,136,26.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,88,151.74V48a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V120a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V64.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,216,64Z"/>
          </g>
          <g transform="translate(32 32) scale(0.162) translate(-128 -128)" aria-hidden="true">
            <path fill="url(#g${uid}psghand)" stroke="#0f2418" stroke-width="1" stroke-linejoin="round" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M216,64v90.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,72.6,215.4C50.79,192.33,26.15,136,26.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,88,151.74V48a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V120a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V64.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,216,64Z"/>
          </g>`,
        )
      case 'premium_player':
        return g(
          `<defs>
            <linearGradient id="g${uid}pprim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}ppin" cx="50%" cy="42%" r="78%">
              <stop offset="0%" stop-color="#2a3444"/>
              <stop offset="55%" stop-color="#161c28"/>
              <stop offset="100%" stop-color="#060810"/>
            </radialGradient>
            <linearGradient id="g${uid}ppplate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#f4f6fc"/>
              <stop offset="25%" stop-color="#c8d0e0"/>
              <stop offset="70%" stop-color="#8898b0"/>
              <stop offset="100%" stop-color="#5a6880"/>
            </linearGradient>
            <linearGradient id="g${uid}ppgold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff4d4"/>
              <stop offset="50%" stop-color="#d4a848"/>
              <stop offset="100%" stop-color="#5c4018"/>
            </linearGradient>
            <linearGradient id="g${uid}ppnum" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#1e2838"/>
              <stop offset="100%" stop-color="#0a0e14"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}pprim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}ppin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <rect x="15.2" y="23.2" width="33.6" height="21.6" rx="4.4" fill="rgba(0,0,0,0.3)"/>
          <rect x="14" y="22" width="36" height="24" rx="4.5" fill="url(#g${uid}ppplate)" stroke="url(#g${uid}ppgold)" stroke-width="1.15"/>
          <rect x="14" y="22" width="36" height="24" rx="4.5" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/>
          <ellipse cx="32" cy="26" rx="11" ry="3.5" fill="rgba(255,255,255,0.4)"/>
          <text x="32" y="37.5" text-anchor="middle" fill="url(#g${uid}ppnum)" stroke="rgba(255,255,255,0.35)" stroke-width="0.35" paint-order="stroke fill" font-family="system-ui,sans-serif" font-size="17" font-weight="800">25</text>
          <text x="32" y="43.5" text-anchor="middle" fill="#4a5868" font-family="system-ui,sans-serif" font-size="6.5" font-weight="700" letter-spacing="0.28em">PREMIUM</text>`,
        )
      case 'elite_player':
        return g(
          `<defs>
            <linearGradient id="g${uid}elrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}elin" cx="45%" cy="38%" r="80%">
              <stop offset="0%" stop-color="#7868a0"/>
              <stop offset="48%" stop-color="#403060"/>
              <stop offset="100%" stop-color="#080410"/>
            </radialGradient>
            <linearGradient id="g${uid}elstar" x1="32" y1="8" x2="32" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="35%" stop-color="#e8d0f8"/>
              <stop offset="72%" stop-color="#9880c8"/>
              <stop offset="100%" stop-color="#604878"/>
            </linearGradient>
            <linearGradient id="g${uid}elring" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stop-color="#604020"/>
              <stop offset="25%" stop-color="#f0d090"/>
              <stop offset="50%" stop-color="#c8a060"/>
              <stop offset="75%" stop-color="#e8d8a8"/>
              <stop offset="100%" stop-color="#584018"/>
            </linearGradient>
            <linearGradient id="g${uid}elsprk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff8ff"/>
              <stop offset="100%" stop-color="#c8a0e8"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}elrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}elin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="33" rx="16" ry="13" fill="rgba(200,170,255,0.09)"/>
          <circle cx="32" cy="32" r="17.2" fill="none" stroke="url(#g${uid}elring)" stroke-width="0.75" opacity="0.9"/>
          <circle cx="32" cy="32" r="16.3" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.35"/>
          <g transform="translate(32.6 32.4) scale(0.92) translate(-32 -32)" opacity="0.4" aria-hidden="true">
            <path fill="#0a0610" d="M32 8l6 10 10 2-8 8 2 12-10-6-10 6 2-12-8-8 10-2z"/>
          </g>
          <g transform="translate(32 32) scale(0.92) translate(-32 -32)">
            <path fill="url(#g${uid}elstar)" stroke="#1e1028" stroke-width="0.55" stroke-linejoin="round" d="M32 8l6 10 10 2-8 8 2 12-10-6-10 6 2-12-8-8 10-2z"/>
            <ellipse cx="28" cy="16" rx="4" ry="2.4" fill="rgba(255,255,255,0.45)" transform="rotate(-22 28 16)"/>
          </g>
          <g fill="url(#g${uid}elsprk)" stroke="#2a1838" stroke-width="0.1" paint-order="stroke fill" aria-hidden="true">
            <path transform="translate(32 14) rotate(12) scale(0.38)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(46 26) rotate(-35) scale(0.32)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(44 40) rotate(20) scale(0.35)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(20 40) rotate(-18) scale(0.33)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(18 26) rotate(40) scale(0.36)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
          </g>${bjCornerSparklesHtml()}`,
        )
      case 'century_club':
        return g(
          `<defs>
            <linearGradient id="g${uid}ccrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}ccin" cx="45%" cy="42%" r="80%">
              <stop offset="0%" stop-color="#4a5a78"/>
              <stop offset="52%" stop-color="#283448"/>
              <stop offset="100%" stop-color="#080c14"/>
            </radialGradient>
            <linearGradient id="g${uid}ccnum" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#e8f0ff"/>
              <stop offset="50%" stop-color="#a8c0e0"/>
              <stop offset="100%" stop-color="#5870a0"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}ccrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}ccin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="33" rx="14" ry="11" fill="rgba(160,180,220,0.12)"/>
          <text x="32" y="38.5" text-anchor="middle" fill="url(#g${uid}ccnum)" stroke="#0a1020" stroke-width="0.5" paint-order="stroke fill" font-family="Georgia,serif" font-size="20" font-weight="700">100</text>`,
        )
      case 'first_blood':
        return g(
          `<defs>
            <linearGradient id="g${uid}fbrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}fbin" cx="48%" cy="44%" r="82%">
              <stop offset="0%" stop-color="#4a2830"/>
              <stop offset="55%" stop-color="#241018"/>
              <stop offset="100%" stop-color="#080408"/>
            </radialGradient>
            <linearGradient id="g${uid}fbdrop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffa8a8"/>
              <stop offset="45%" stop-color="#e83850"/>
              <stop offset="100%" stop-color="#780818"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}fbrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}fbin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="33" rx="14" ry="11" fill="rgba(200,80,90,0.12)"/>
          <g transform="translate(32 32) scale(0.56) translate(-32 -29)">
            <path fill="url(#g${uid}fbdrop)" stroke="#400810" stroke-width="0.85" stroke-linejoin="round" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M32 6c-4 12-14 18-14 28 0 10 8 16 14 22 6-6 14-12 14-22 0-10-10-16-14-28z"/>
            <ellipse cx="32" cy="26" rx="6" ry="4" fill="rgba(255,255,255,0.38)"/>
          </g>`,
        )
      case 'on_heater':
        return g(
          `<defs>
            <linearGradient id="g${uid}ohrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}ohin" cx="45%" cy="48%" r="85%">
              <stop offset="0%" stop-color="#3a2820"/>
              <stop offset="55%" stop-color="#181008"/>
              <stop offset="100%" stop-color="#040204"/>
            </radialGradient>
            <linearGradient id="g${uid}ohfl" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#ff5a20"/>
              <stop offset="45%" stop-color="#ffc040"/>
              <stop offset="85%" stop-color="#fff8d0"/>
              <stop offset="100%" stop-color="#fffef8"/>
            </linearGradient>
            <linearGradient id="g${uid}ohside" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#e84818"/>
              <stop offset="60%" stop-color="#ffb030"/>
              <stop offset="100%" stop-color="#fff5cc"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}ohrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}ohin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="36" rx="14" ry="10" fill="rgba(255,120,40,0.1)"/>
          <g transform="translate(32 33) scale(0.54) translate(-32 -36)">
            <path fill="url(#g${uid}ohfl)" stroke="#5a2010" stroke-width="0.75" stroke-linejoin="round" vector-effect="non-scaling-stroke" d="M32 52c-8-6-10-16-6-24 2-4 6-6 6-14 4 4 6 10 6 16 0 8-4 16-6 22z"/>
            <path fill="url(#g${uid}ohside)" opacity="0.92" d="M18 48c-4-8-2-14 2-20 3 6 4 12 2 18l-4 2z"/>
            <path fill="url(#g${uid}ohside)" opacity="0.92" d="M46 48c4-8 2-14-2-20-3 6-4 12-2 18l4 2z"/>
          </g>${bjCornerSparklesHtml()}`,
        )
      case 'blackjack_soul':
        /* Fortune-smile layout + star above 21; emerald felt (not purple fortune) */
        return g(
          `<defs>
            <linearGradient id="g${uid}bjrim" x1="18%" y1="12%" x2="82%" y2="88%">
              <stop offset="0%" stop-color="#fff0d8"/>
              <stop offset="38%" stop-color="#d8a848"/>
              <stop offset="72%" stop-color="#886020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}bjin" cx="40%" cy="32%" r="80%">
              <stop offset="0%" stop-color="#1a6850"/>
              <stop offset="45%" stop-color="#0c3828"/>
              <stop offset="100%" stop-color="#040c10"/>
            </radialGradient>
            <linearGradient id="g${uid}bjgl" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="50%" stop-color="#e8f0c8"/>
              <stop offset="100%" stop-color="#98b060"/>
            </linearGradient>
            <linearGradient id="g${uid}bjstar" x1="30%" y1="10%" x2="70%" y2="90%">
              <stop offset="0%" stop-color="#fffef0"/>
              <stop offset="40%" stop-color="#f0e090"/>
              <stop offset="100%" stop-color="#b88828"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}bjrim)" stroke="#1a1408" stroke-width="0.6"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="0.5"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}bjin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="26" rx="14" ry="8" fill="rgba(180,255,220,0.06)"/>
          <g class="d21-badge-sparkles" fill="#d8f8e8" opacity="0.88">
            <path d="M12 18l1.1 2.4 2.6.4-1.9 1.8.5 2.7-2.3-1.2-2.3 1.2.5-2.7-1.9-1.8 2.6-.4z"/>
            <path d="M52 16l.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z"/>
            <path d="M48 46l.7 1.5 1.7.2-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.2z"/>
          </g>
          <circle cx="23.5" cy="27" r="2.4" fill="url(#g${uid}bjgl)" stroke="#0e2010" stroke-width="0.35"/>
          <circle cx="40.5" cy="27" r="2.4" fill="url(#g${uid}bjgl)" stroke="#0e2010" stroke-width="0.35"/>
          <ellipse cx="23.5" cy="26.2" rx="0.9" ry="0.55" fill="rgba(255,255,255,0.5)"/>
          <ellipse cx="40.5" cy="26.2" rx="0.9" ry="0.55" fill="rgba(255,255,255,0.5)"/>
          <g transform="translate(32 29) scale(0.4) translate(-32 -32)">
            <path fill="url(#g${uid}bjstar)" stroke="#2a2010" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M32 8l6 10 10 2-8 8 2 12-10-6-10 6 2-12-8-8 10-2z"/>
            <ellipse cx="28" cy="18" rx="3.5" ry="2" fill="rgba(255,255,255,0.4)" transform="rotate(-25 28 18)"/>
          </g>
          <text x="32" y="41.5" text-anchor="middle" fill="url(#g${uid}bjgl)" stroke="#0a1808" stroke-width="0.45" paint-order="stroke fill" font-family="Georgia,serif" font-size="17" font-weight="700">21</text>
          <path d="M17.5 45.5 Q32 58.5 46.5 45.5" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M17.5 45.5 Q32 58.5 46.5 45.5" fill="none" stroke="#78d8a8" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M18 45.2 Q32 57.2 46 45.2" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="0.9" stroke-linecap="round"/>`,
        )
      case 'double_dare':
        return g(
          `<defs>
            <linearGradient id="g${uid}ddrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}ddin" cx="48%" cy="42%" r="78%">
              <stop offset="0%" stop-color="#2a3848"/>
              <stop offset="55%" stop-color="#141a22"/>
              <stop offset="100%" stop-color="#06080c"/>
            </radialGradient>
            <linearGradient id="g${uid}ddcard" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="45%" stop-color="#f0e8dc"/>
              <stop offset="100%" stop-color="#d4c8b8"/>
            </linearGradient>
            <linearGradient id="g${uid}ddgold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff4d4"/>
              <stop offset="50%" stop-color="#d4a848"/>
              <stop offset="100%" stop-color="#6a4818"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}ddrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}ddin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <g transform="translate(21.5 33.5) rotate(-11)">
            <rect x="-9.5" y="-13" width="19" height="26" rx="2.4" fill="rgba(0,0,0,0.28)" transform="translate(1.2 1.2)"/>
            <rect x="-10" y="-14" width="20" height="28" rx="2.5" fill="url(#g${uid}ddcard)" stroke="url(#g${uid}ddgold)" stroke-width="1.05"/>
            <ellipse cx="0" cy="-7" rx="5" ry="3" fill="rgba(255,255,255,0.35)"/>
            <circle cx="0" cy="1" r="2.6" fill="#121820" stroke="#2a3038" stroke-width="0.35"/>
          </g>
          <g transform="translate(42.5 33.5) rotate(11)">
            <rect x="-9.5" y="-13" width="19" height="26" rx="2.4" fill="rgba(0,0,0,0.32)" transform="translate(1.1 1.1)"/>
            <rect x="-10" y="-14" width="20" height="28" rx="2.5" fill="url(#g${uid}ddcard)" stroke="url(#g${uid}ddgold)" stroke-width="1.05"/>
            <ellipse cx="0" cy="-7" rx="5" ry="3" fill="rgba(255,255,255,0.35)"/>
            <circle cx="0" cy="1" r="2.6" fill="#121820" stroke="#2a3038" stroke-width="0.35"/>
          </g>
          <path d="M28.5 28 L35.5 35 M35.5 28 L28.5 35" fill="none" stroke="url(#g${uid}ddgold)" stroke-width="2.2" stroke-linecap="round"/>
          <text x="32" y="53.5" text-anchor="middle" fill="url(#g${uid}ddgold)" font-family="system-ui,sans-serif" font-size="10.5" font-weight="800" letter-spacing="0.06em">×2</text>`,
        )
      case 'push_master':
        /* Open-hand silhouette: Phosphor Icons (MIT) — assets/fill/hand-fill.svg, scaled into view */
        return g(
          `<defs>
            <linearGradient id="g${uid}pmrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}pmin" cx="45%" cy="42%" r="82%">
              <stop offset="0%" stop-color="#6a7a94"/>
              <stop offset="42%" stop-color="#384558"/>
              <stop offset="100%" stop-color="#0c1018"/>
            </radialGradient>
            <linearGradient id="g${uid}pmhand" x1="30%" y1="15%" x2="70%" y2="85%">
              <stop offset="0%" stop-color="#f4eee4"/>
              <stop offset="55%" stop-color="#e0d4c4"/>
              <stop offset="100%" stop-color="#b8a898"/>
            </linearGradient>
            <linearGradient id="g${uid}pmsprk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fffef8"/>
              <stop offset="100%" stop-color="#d4b868"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}pmrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}pmin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <g fill="url(#g${uid}pmsprk)" stroke="#3a3020" stroke-width="0.12" paint-order="stroke fill" aria-hidden="true">
            <path transform="translate(32 18.2) rotate(8) scale(0.52)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(43.4 25.8) rotate(52) scale(0.44)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(43.2 38.5) rotate(-28) scale(0.48)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(32 45.8) rotate(15) scale(0.5)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(20.6 38.5) rotate(-15) scale(0.42)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
            <path transform="translate(20.8 25.8) rotate(35) scale(0.46)" d="M0 -2.1 L0.38 -0.38 L2.1 0 L0.38 0.38 L0 2.1 L-0.38 0.38 L-2.1 0 L-0.38 -0.38 Z"/>
          </g>
          <g transform="translate(33.2 33.2) scale(0.162) translate(-128 -128)" opacity="0.35" aria-hidden="true">
            <path fill="#050608" d="M216,64v90.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,72.6,215.4C50.79,192.33,26.15,136,26.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,88,151.74V48a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V120a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V64.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,216,64Z"/>
          </g>
          <g transform="translate(32 32) scale(0.162) translate(-128 -128)" aria-hidden="true">
            <path fill="url(#g${uid}pmhand)" stroke="#1a1410" stroke-width="1" stroke-linejoin="round" paint-order="stroke fill" vector-effect="non-scaling-stroke" d="M216,64v90.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,72.6,215.4C50.79,192.33,26.15,136,26.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,88,151.74V48a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V120a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V64.45c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,216,64Z"/>
          </g>`,
        )
      case 'high_roller':
        return g(
          `<defs>
            <linearGradient id="g${uid}hrrim" x1="14%" y1="10%" x2="86%" y2="90%">
              <stop offset="0%" stop-color="#fff6e0"/>
              <stop offset="32%" stop-color="#e4bc58"/>
              <stop offset="68%" stop-color="#8a6020"/>
              <stop offset="100%" stop-color="#3a2010"/>
            </linearGradient>
            <radialGradient id="g${uid}hrin" cx="48%" cy="45%" r="82%">
              <stop offset="0%" stop-color="#2a2830"/>
              <stop offset="55%" stop-color="#14161c"/>
              <stop offset="100%" stop-color="#060608"/>
            </radialGradient>
            <linearGradient id="g${uid}hrbar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#5a4818"/>
              <stop offset="22%" stop-color="#d4b050"/>
              <stop offset="45%" stop-color="#fff4d0"/>
              <stop offset="58%" stop-color="#e0b040"/>
              <stop offset="82%" stop-color="#886020"/>
              <stop offset="100%" stop-color="#3a2810"/>
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="27" fill="url(#g${uid}hrrim)" stroke="#1a1008" stroke-width="0.55"/>
          <circle cx="32" cy="32" r="24.5" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.45"/>
          <circle cx="32" cy="32" r="22" fill="url(#g${uid}hrin)"/>
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
          <ellipse cx="32" cy="42" rx="17" ry="4.5" fill="rgba(0,0,0,0.34)"/>
          <rect x="11.5" y="27" width="41" height="15" rx="2.5" fill="rgba(0,0,0,0.3)" transform="translate(0.9 1.1)"/>
          <rect x="11" y="25" width="42" height="16" rx="2.6" fill="url(#g${uid}hrbar)" stroke="#1a1408" stroke-width="0.55"/>
          <path d="M13 26.8 H51" stroke="rgba(255,255,255,0.5)" stroke-width="0.85" stroke-linecap="round"/>
          <path d="M13 39.5 H51" stroke="rgba(0,0,0,0.28)" stroke-width="0.55" stroke-linecap="round"/>${bjCornerSparklesHtml()}`,
        )
      default:
        return g('<circle cx="32" cy="32" r="20" fill="#2a2e3c" stroke="#5a6270"/>')
    }
  }

  function render() {
    const grid = document.getElementById('d21BadgeGrid')
    if (!grid) return

    const preview = isBadgesArtworkPreview()
    syncPreviewChrome(preview)

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
      el.classList.toggle('d21-badge-slot--premium', on && PREMIUM_ANIM_BADGE_IDS.has(id))
      if (inited && on && !prevUnlocked.has(id) && !preview) {
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
  /**
   * @param {boolean} on — true: show all badge art (persists in localStorage); false: clear preview
   */
  window.d21BadgeArtworkPreview = function (on) {
    try {
      if (on) localStorage.setItem(LS_PREVIEW, '1')
      else localStorage.removeItem(LS_PREVIEW)
    } catch {
      /* ignore */
    }
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render)
  } else {
    render()
  }
})()
