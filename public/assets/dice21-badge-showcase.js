/**
 * Upper-left badge artwork — syncs with dice21_achievements_v1 and game __d21Ach.
 */
;(function () {
  const ACH_KEY = 'dice21_achievements_v1'
  const ORDER = ['first_blood', 'on_heater', 'blackjack_soul', 'double_dare', 'push_master', 'high_roller']

  const LABELS = {
    first_blood: 'First blood',
    on_heater: 'On a heater',
    blackjack_soul: 'Blackjack soul',
    double_dare: 'Double dare',
    push_master: 'Push master',
    high_roller: 'High roller',
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
          '<path fill="none" stroke="#8a9aaf" stroke-width="2.5" stroke-linecap="round" d="M18 40l-8-8 8-8"/><path fill="none" stroke="#8a9aaf" stroke-width="2.5" stroke-linecap="round" d="M46 24l8 8-8 8"/><text x="32" y="38" text-anchor="middle" fill="#c8d4e8" font-family="system-ui,sans-serif" font-size="11" font-weight="700">PUSH</text>',
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

    if (!grid.dataset.built) {
      grid.innerHTML = ORDER.map((id) => {
        return `<div class="d21-badge-slot" data-badge="${id}" title="${LOCKED_TITLE}">
          <span class="d21-badge-slot__frame">${placeholderSvg()}</span>
          <span class="d21-badge-slot__lock" aria-hidden="true">🔒</span>
        </div>`
      }).join('')
      grid.dataset.built = '1'
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
