/**
 * Dice 21 — optional career tournaments (real bankroll, same lifetime stats).
 * Disabled for MP guests. Gates use career table index (`minTable`) + hands + $ won.
 * Tournament list and series length: edit `dice21-rules.js` (see `window.__d21Rules`).
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const STORAGE_DONE = 'dice21_tournament_done'
  const STORAGE_RUN = 'dice21_tournament_run'

  /** Fallback if `dice21-rules.js` did not load */
  const DEFAULT_TOURNAMENTS = Object.freeze([
    { id: 1, name: 'Club Classic', prize: 'Big-screen TV', minTable: 0, minHands: 12, minWon: 500 },
    { id: 2, name: 'Skyline Open', prize: 'Laptop & gear', minTable: 0, minHands: 28, minWon: 5000 },
    { id: 3, name: 'Premium Gala', prize: 'Jewelry & watch', minTable: 1, minHands: 55, minWon: 15000 },
    { id: 4, name: 'Elite Showcase', prize: 'Sports car weekend', minTable: 1, minHands: 90, minWon: 40000 },
    { id: 5, name: 'High Roller Cup', prize: 'Yacht charter', minTable: 2, minHands: 125, minWon: 100000 },
    { id: 6, name: 'Grand Invitational', prize: 'Dream garage & collection', minTable: 3, minHands: 180, minWon: 300000 },
  ])

  function tournamentsList() {
    const t = window.__d21Rules && window.__d21Rules.tournaments
    return Array.isArray(t) && t.length ? t : DEFAULT_TOURNAMENTS
  }

  const TOURNAMENTS = Object.freeze(tournamentsList())

  function winsToClinch() {
    const n = window.__d21Rules && window.__d21Rules.tournamentWinsToClinch
    const v = Number(n)
    return v >= 1 && v <= 9 ? v | 0 : 2
  }

  function isGuest() {
    return window.__d21Role === 'guest'
  }

  function readLifetime() {
    try {
      const j = JSON.parse(localStorage.getItem('dice21_lifetime_v1') || '{}')
      return { lsH: +j.hands || 0, lsW: +j.won || 0 }
    } catch {
      return { lsH: 0, lsW: 0 }
    }
  }

  function readDone() {
    try {
      const j = JSON.parse(localStorage.getItem(STORAGE_DONE) || '[]')
      return Array.isArray(j) ? j.filter((n) => Number.isFinite(n)) : []
    } catch {
      return []
    }
  }

  function writeDone(done) {
    try {
      localStorage.setItem(STORAGE_DONE, JSON.stringify(done))
    } catch {
      /* ignore */
    }
  }

  function readRun() {
    try {
      const raw = localStorage.getItem(STORAGE_RUN)
      if (!raw) return null
      const o = JSON.parse(raw)
      if (!o || typeof o.id !== 'number') return null
      return { id: o.id, wins: o.wins | 0, losses: o.losses | 0 }
    } catch {
      return null
    }
  }

  function writeRun(run) {
    try {
      if (!run) localStorage.removeItem(STORAGE_RUN)
      else localStorage.setItem(STORAGE_RUN, JSON.stringify(run))
    } catch {
      /* ignore */
    }
  }

  function gateMet(t, lsH, lsW, tableIdx) {
    const minT = typeof t.minTable === 'number' ? t.minTable | 0 : 0
    if ((tableIdx | 0) < minT) return false
    if (lsH < t.minHands) return false
    if (lsW < t.minWon) return false
    return true
  }

  function prevDone(t, done) {
    if (t.id === 1) return true
    return done.includes(t.id - 1)
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function showToast(title, sub, ms) {
    const el = document.getElementById('d21TournamentToast')
    if (!el) return
    const t = title ? `<strong>${escapeHtml(title)}</strong>` : ''
    const u = sub ? `<span class="d21-tournament-toast-sub">${escapeHtml(sub)}</span>` : ''
    el.innerHTML = t + u
    el.hidden = false
    el.classList.add('is-visible')
    if (typeof window.d21PlayPopupShowSfx === 'function') window.d21PlayPopupShowSfx()
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => {
      el.classList.remove('is-visible')
      el.hidden = true
    }, ms === undefined ? 3200 : ms)
  }

  function updateStrip(run) {
    const wrap = document.getElementById('d21TournamentActive')
    const titleEl = document.getElementById('d21TournamentActiveTitle')
    const scoreEl = document.getElementById('d21TournamentActiveScore')
    if (!wrap || !titleEl || !scoreEl) return
    if (!run || isGuest()) {
      wrap.hidden = true
      wrap.setAttribute('aria-hidden', 'true')
      return
    }
    const t = TOURNAMENTS.find((x) => x.id === run.id)
    if (!t) {
      wrap.hidden = true
      return
    }
    titleEl.textContent = `${t.name} · Play for ${t.prize}`
    scoreEl.textContent = `Series ${run.wins}–${run.losses} · first to ${winsToClinch()} wins (ties replay)`
    wrap.hidden = false
    wrap.setAttribute('aria-hidden', 'false')
  }

  function renderList() {
    const root = document.getElementById('d21TournamentList')
    const countEl = document.getElementById('d21TournamentCount')
    const section = document.getElementById('d21TournamentDetails')
    if (!root || !section) return

    if (isGuest()) {
      section.hidden = true
      section.setAttribute('aria-hidden', 'true')
      return
    }
    section.hidden = false
    section.setAttribute('aria-hidden', 'false')

    const done = readDone()
    const run = readRun()
    const { lsH, lsW } = readLifetime()
    const tableIdx =
      typeof window.__d21GameTableIndex === 'number' ? window.__d21GameTableIndex | 0 : 0

    if (countEl) countEl.textContent = `${done.length}/${TOURNAMENTS.length}`

    root.innerHTML = TOURNAMENTS.map((t) => {
      const completed = done.includes(t.id)
      const needPrev = !prevDone(t, done)
      const gateOk = gateMet(t, lsH, lsW, tableIdx)
      const eligible = !completed && !needPrev && gateOk
      const busyOther = run && run.id !== t.id

      let statusClass = 'locked'
      let statusText = ''
      let btnHtml = ''

      if (completed) {
        statusClass = 'cleared'
        statusText = 'Cleared'
      } else if (needPrev) {
        statusText = `Locked — clear tournament ${t.id - 1} first`
      } else if (!gateOk) {
        const minT = typeof t.minTable === 'number' ? t.minTable | 0 : 0
        statusText = `Need table ${minT + 1}+ · ${t.minHands} hands · $${t.minWon.toLocaleString()} won`
      } else if (run && run.id === t.id) {
        statusClass = 'active'
        statusText = `Series ${run.wins}–${run.losses} · first to ${winsToClinch()}`
        btnHtml = ''
      } else if (busyOther) {
        statusText = 'Finish your current tournament first'
      } else {
        statusClass = 'eligible'
        statusText = 'Ready to enter'
        btnHtml = `<button type="button" class="d21-tournament-enter ghost" data-tournament-id="${t.id}">Play for prize</button>`
      }

      return `<div class="d21-tournament-row ${statusClass}" data-tid="${t.id}">
        <div class="d21-tournament-row-head"><span class="d21-tournament-name">${escapeHtml(t.name)}</span><span class="d21-tournament-prize">${escapeHtml(t.prize)}</span></div>
        <p class="d21-tournament-status">${escapeHtml(statusText)}</p>${btnHtml}
      </div>`
    }).join('')

    updateStrip(run)
  }

  function onEnterClick(ev) {
    const id = +ev.currentTarget.getAttribute('data-tournament-id')
    if (!Number.isFinite(id)) return
    const run = readRun()
    if (run) {
      showToast('', 'Finish or leave your current tournament first.', 2600)
      return
    }
    const t = TOURNAMENTS.find((x) => x.id === id)
    if (!t) return
    writeRun({ id, wins: 0, losses: 0 })
    showToast(t.name, `Best of series: first to ${winsToClinch()} wins · real chips · ties replay`, 4000)
    renderList()
  }

  function onAbandon() {
    if (!readRun()) return
    writeRun(null)
    showToast('', 'Left tournament — you can re-enter when eligible.', 2400)
    renderList()
  }

  function afterHand(outcome) {
    if (isGuest()) return
    const run = readRun()
    if (!run) return
    const t = TOURNAMENTS.find((x) => x.id === run.id)
    if (!t) {
      writeRun(null)
      return
    }

    if (outcome === 'push') {
      updateStrip(run)
      return
    }

    if (outcome === 'player') run.wins++
    else if (outcome === 'ai') run.losses++

    if (run.wins >= winsToClinch()) {
      const done = readDone()
      if (!done.includes(run.id)) {
        done.push(run.id)
        done.sort((a, b) => a - b)
        writeDone(done)
      }
      writeRun(null)
      showToast(`Won: ${t.name}`, `Fantasy prize: ${t.prize} — career stats unchanged.`, 4500)
      renderList()
      updateStrip(null)
      return
    }

    if (run.losses >= winsToClinch()) {
      writeRun(null)
      showToast('Tournament lost', `${t.name} — house wins the series. Try again anytime.`, 4000)
      renderList()
      updateStrip(null)
      return
    }

    writeRun(run)
    updateStrip(run)
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_DONE)
      localStorage.removeItem(STORAGE_RUN)
    } catch {
      /* ignore */
    }
    renderList()
  }

  function noDouble() {
    return !!readRun() && !isGuest()
  }

  function wire() {
    const root = document.getElementById('d21TournamentList')
    if (root && !root._d21TournamentDelegation) {
      root._d21TournamentDelegation = true
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-tournament-id]')
        if (!btn) return
        onEnterClick({ currentTarget: btn })
      })
    }
    const ab = document.getElementById('d21TournamentAbandon')
    if (ab && !ab._d21TournamentWired) {
      ab._d21TournamentWired = true
      ab.addEventListener('click', onAbandon)
    }
  }

  function init() {
    wire()
    renderList()
  }

  function onRoleChange() {
    if (isGuest()) {
      writeRun(null)
      updateStrip(null)
    }
    init()
  }

  window.__d21TournamentAfterHand = afterHand
  window.__d21TournamentNoDouble = noDouble
  window.__d21TournamentReset = resetAll

  window.addEventListener('d21-ready', init)
  window.addEventListener('d21-rolechange', onRoleChange)
  window.addEventListener('d21-table', renderList)
  window.addEventListener('storage', (e) => {
    if (e.key === 'dice21_lifetime_v1' || e.key === STORAGE_DONE || e.key === STORAGE_RUN) renderList()
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
