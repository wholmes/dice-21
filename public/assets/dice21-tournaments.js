/**
 * Dice 21 — dual tournament tracks: one **lifetime** championship + one **table cup** per felt.
 * Same bankroll & lifetime stats; fantasy prizes. Double-or-nothing off during an active series.
 * Rules object: `window.__d21Rules.tournamentLifetime`, `tournamentByTable`, `tournamentWinsToClinch`.
 *
 * Dev testing (host only): `__d21TournamentDev*` is always on `window`; add
 * `?d21dev=1` or `localStorage.setItem('d21dev','1')` so those calls change state.
 * Use `__d21TournamentDevHelp()` for the full command list.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const STORAGE_STATE = 'dice21_tournament_state_v1'
  const LEGACY_DONE = 'dice21_tournament_done'
  const LEGACY_RUN = 'dice21_tournament_run'

  const DEFAULT_LIFE = Object.freeze({
    id: 'life',
    name: 'Hall of Fame',
    prize: 'Legend ring (fantasy)',
    minHands: 60,
    minWon: 50000,
  })

  const DEFAULT_BY_TABLE = Object.freeze([
    { tableIndex: 0, name: 'Club Cup', prize: 'Lounge upgrade (fantasy)', minHands: 6, minWon: 300 },
    { tableIndex: 1, name: 'Skyline Cup', prize: 'City suite night (fantasy)', minHands: 8, minWon: 8000 },
    { tableIndex: 2, name: 'Summit Cup', prize: 'Jewelry & watch (fantasy)', minHands: 10, minWon: 40000 },
    { tableIndex: 3, name: 'Pinnacle Cup', prize: 'Garage weekend (fantasy)', minHands: 12, minWon: 400000 },
  ])

  function lifeDef() {
    const t = window.__d21Rules && window.__d21Rules.tournamentLifetime
    return t && typeof t.id === 'string' ? t : DEFAULT_LIFE
  }

  function tableDefs() {
    const t = window.__d21Rules && window.__d21Rules.tournamentByTable
    return Array.isArray(t) && t.length ? t : DEFAULT_BY_TABLE
  }

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

  function defaultState() {
    const n = tableDefs().length
    const tables = []
    for (let i = 0; i < n; i++) tables.push(false)
    const perTable = {}
    for (let i = 0; i < n; i++) perTable[String(i)] = { h: 0, w: 0 }
    return { done: { lifetime: false, tables }, run: null, perTable }
  }

  function readStateRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_STATE)
      if (!raw) return null
      const o = JSON.parse(raw)
      if (!o || typeof o !== 'object') return null
      return o
    } catch {
      return null
    }
  }

  function migrateLegacyOnce() {
    if (readStateRaw()) return
    const next = defaultState()
    try {
      localStorage.setItem(STORAGE_STATE, JSON.stringify(next))
      localStorage.removeItem(LEGACY_DONE)
      localStorage.removeItem(LEGACY_RUN)
    } catch {
      /* ignore */
    }
  }

  function readState() {
    migrateLegacyOnce()
    const o = readStateRaw()
    if (!o) return defaultState()
    const base = defaultState()
    if (o.done && typeof o.done === 'object') {
      base.done.lifetime = !!o.done.lifetime
      if (Array.isArray(o.done.tables)) {
        const n = base.done.tables.length
        for (let i = 0; i < n; i++) {
          base.done.tables[i] = !!o.done.tables[i]
        }
      }
    }
    if (o.run && typeof o.run === 'object') {
      const r = o.run
      if (r.scope === 'lifetime' && typeof r.wins === 'number' && typeof r.losses === 'number') {
        base.run = { scope: 'lifetime', wins: r.wins | 0, losses: r.losses | 0 }
      } else if (r.scope === 'table' && typeof r.tableIndex === 'number' && typeof r.wins === 'number' && typeof r.losses === 'number') {
        base.run = { scope: 'table', tableIndex: r.tableIndex | 0, wins: r.wins | 0, losses: r.losses | 0 }
      }
    }
    if (o.perTable && typeof o.perTable === 'object') {
      for (const k of Object.keys(base.perTable)) {
        const p = o.perTable[k]
        if (p && typeof p === 'object') {
          base.perTable[k] = { h: Math.max(0, +p.h || 0), w: Math.max(0, +p.w || 0) }
        }
      }
    }
    const tn = tableDefs().length
    while (base.done.tables.length < tn) base.done.tables.push(false)
    while (base.done.tables.length > tn) base.done.tables.pop()
    return base
  }

  function writeState(s) {
    try {
      localStorage.setItem(STORAGE_STATE, JSON.stringify(s))
    } catch {
      /* ignore */
    }
  }

  function currentTableIdx() {
    return typeof window.__d21GameTableIndex === 'number' ? window.__d21GameTableIndex | 0 : 0
  }

  function bumpPerTableStats(outcome, potWon, tableIdx) {
    const s = readState()
    const k = String(tableIdx | 0)
    if (!s.perTable[k]) s.perTable[k] = { h: 0, w: 0 }
    s.perTable[k].h += 1
    if (outcome === 'player') s.perTable[k].w += Math.max(0, potWon | 0)
    writeState(s)
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

  /** Keys for cleared trophies, in display order: lifetime first, then table cups by rules order. */
  function getTrophyFlags() {
    if (isGuest()) return []
    const st = readState()
    const done = st.done
    const out = []
    if (done.lifetime) out.push('life')
    for (const row of tableDefs()) {
      const ti = row.tableIndex | 0
      if (done.tables[ti]) out.push('t' + ti)
    }
    return out
  }

  function syncTrophy3D() {
    if (typeof window.__d21TournamentTrophiesSync === 'function') {
      window.__d21TournamentTrophiesSync()
    }
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
    let title = ''
    if (run.scope === 'lifetime') {
      const L = lifeDef()
      title = `${L.name} · ${L.prize}`
    } else if (run.scope === 'table') {
      const row = tableDefs().find((x) => (x.tableIndex | 0) === (run.tableIndex | 0))
      title = row ? `${row.name} · ${row.prize}` : 'Table cup'
    } else {
      wrap.hidden = true
      return
    }
    titleEl.textContent = title
    scoreEl.textContent = `Series ${run.wins}–${run.losses} · first to ${winsToClinch()} wins (ties replay)`
    wrap.hidden = false
    wrap.setAttribute('aria-hidden', 'false')
  }

  function gateLifetime(lsH, lsW) {
    const L = lifeDef()
    return lsH >= (L.minHands | 0) && lsW >= (L.minWon | 0)
  }

  function gateTableRow(row, k) {
    const h = +k.h || 0
    const w = +k.w || 0
    return h >= (row.minHands | 0) && w >= (row.minWon | 0)
  }

  function clearedCount(done) {
    let n = done.lifetime ? 1 : 0
    for (let i = 0; i < done.tables.length; i++) if (done.tables[i]) n += 1
    return n
  }

  function totalEvents() {
    return 1 + tableDefs().length
  }

  function renderList() {
    const root = document.getElementById('d21TournamentList')
    const countEl = document.getElementById('d21TournamentCount')
    const section = document.getElementById('d21TournamentDetails')
    if (!root || !section) {
      syncTrophy3D()
      return
    }

    if (isGuest()) {
      section.hidden = true
      section.setAttribute('aria-hidden', 'true')
      syncTrophy3D()
      return
    }
    section.hidden = false
    section.setAttribute('aria-hidden', 'false')

    const st = readState()
    const done = st.done
    const run = st.run
    const { lsH, lsW } = readLifetime()
    const tidx = currentTableIdx()
    const per = st.perTable

    if (countEl) countEl.textContent = `${clearedCount(done)}/${totalEvents()}`

    const L = lifeDef()
    const busy = !!run

    function rowHtml(opts) {
      const {
        kind,
        key,
        name,
        prize,
        completed,
        statusClass,
        statusText,
        showEnter,
      } = opts
      const btn = showEnter
        ? `<button type="button" class="d21-tournament-enter ghost" data-tournament-kind="${kind}" data-tournament-key="${key}">Play for prize</button>`
        : ''
      return `<div class="d21-tournament-row ${statusClass}" data-kind="${kind}" data-key="${key}">
        <div class="d21-tournament-row-head"><span class="d21-tournament-name">${escapeHtml(name)}</span><span class="d21-tournament-prize">${escapeHtml(prize)}</span></div>
        <p class="d21-tournament-status">${escapeHtml(statusText)}</p>${btn}
      </div>`
    }

    let html = ''
    html += `<h4 class="d21-tournament-section-title">Career championship</h4>`

    {
      const completed = !!done.lifetime
      const gateOk = gateLifetime(lsH, lsW)
      let statusClass = 'locked'
      let statusText = ''
      let showEnter = false
      if (completed) {
        statusClass = 'cleared'
        statusText = 'Cleared'
      } else if (!gateOk) {
        statusText = `Need ${L.minHands} lifetime hands · $${L.minWon.toLocaleString()} won`
      } else if (busy && run.scope !== 'lifetime') {
        statusText = 'Finish your current series first'
      } else if (busy && run.scope === 'lifetime') {
        statusClass = 'active'
        statusText = `Series ${run.wins}–${run.losses} · first to ${winsToClinch()}`
      } else {
        statusClass = 'eligible'
        statusText = 'Ready to enter'
        showEnter = true
      }
      html += rowHtml({
        kind: 'lifetime',
        key: '1',
        name: L.name,
        prize: L.prize,
        completed,
        statusClass,
        statusText,
        showEnter,
      })
    }

    html += `<h4 class="d21-tournament-section-title">Table cups</h4>`
    html += `<p class="d21-tournament-section-hint label-muted">Progress uses hands and $ won <strong>on that table only</strong> (counts across visits). Enter while seated at the matching felt.</p>`

    tableDefs().forEach((row) => {
      const ti = row.tableIndex | 0
      const pk = per[String(ti)] || { h: 0, w: 0 }
      const completed = !!done.tables[ti]
      const gateOk = gateTableRow(row, pk)
      const seatedHere = tidx === ti
      let statusClass = 'locked'
      let statusText = ''
      let showEnter = false
      if (completed) {
        statusClass = 'cleared'
        statusText = 'Cleared'
      } else if (!gateOk) {
        statusText = `On this table: ${pk.h}/${row.minHands} hands · $${pk.w.toLocaleString()} / $${row.minWon.toLocaleString()} won`
      } else if (!seatedHere) {
        statusText = `Eligible — sit at table ${ti + 1} to enter`
      } else if (busy && (run.scope !== 'table' || (run.tableIndex | 0) !== ti)) {
        statusText = 'Finish your current series first'
      } else if (busy && run.scope === 'table' && (run.tableIndex | 0) === ti) {
        statusClass = 'active'
        statusText = `Series ${run.wins}–${run.losses} · first to ${winsToClinch()}`
      } else {
        statusClass = 'eligible'
        statusText = 'Ready to enter'
        showEnter = true
      }
      html += rowHtml({
        kind: 'table',
        key: String(ti),
        name: row.name,
        prize: row.prize,
        completed,
        statusClass,
        statusText,
        showEnter,
      })
    })

    root.innerHTML = html
    updateStrip(run)
    syncTrophy3D()
  }

  function onEnterClick(ev) {
    const kind = ev.currentTarget.getAttribute('data-tournament-kind')
    const key = ev.currentTarget.getAttribute('data-tournament-key')
    if (kind === 'lifetime') {
      const st = readState()
      if (st.run) {
        showToast('', 'Finish or leave your current series first.', 2600)
        return
      }
      if (st.done.lifetime) return
      if (!gateLifetime(readLifetime().lsH, readLifetime().lsW)) return
      st.run = { scope: 'lifetime', wins: 0, losses: 0 }
      writeState(st)
      const L = lifeDef()
      showToast(L.name, `Best of series: first to ${winsToClinch()} wins · ties replay`, 4000)
      renderList()
      return
    }
    if (kind === 'table') {
      const ti = key | 0
      const st = readState()
      if (st.run) {
        showToast('', 'Finish or leave your current series first.', 2600)
        return
      }
      if (st.done.tables[ti]) return
      const row = tableDefs().find((x) => (x.tableIndex | 0) === ti)
      if (!row) return
      if (!gateTableRow(row, st.perTable[String(ti)] || { h: 0, w: 0 })) return
      if (currentTableIdx() !== ti) {
        showToast('', `Sit at table ${ti + 1} to start this cup.`, 2600)
        return
      }
      st.run = { scope: 'table', tableIndex: ti, wins: 0, losses: 0 }
      writeState(st)
      showToast(row.name, `Best of series: first to ${winsToClinch()} wins · ties replay`, 4000)
      renderList()
    }
  }

  function onAbandon() {
    const st = readState()
    if (!st.run) return
    st.run = null
    writeState(st)
    showToast('', 'Left series — you can re-enter when eligible.', 2400)
    renderList()
  }

  function afterHand(outcome, potWon) {
    if (isGuest()) return
    const pot = potWon | 0
    const tid = currentTableIdx()
    bumpPerTableStats(outcome, pot, tid)

    const st = readState()
    const run = st.run
    if (!run) {
      renderList()
      return
    }

    if (outcome === 'push') {
      updateStrip(run)
      return
    }

    if (run.scope === 'table' && tid !== (run.tableIndex | 0)) {
      updateStrip(run)
      return
    }

    if (outcome === 'player') run.wins++
    else if (outcome === 'ai') run.losses++

    if (run.wins >= winsToClinch()) {
      if (run.scope === 'lifetime') {
        st.done.lifetime = true
        const L = lifeDef()
        showToast(`Won: ${L.name}`, `Fantasy prize: ${L.prize}`, 4500)
      } else {
        const ti = run.tableIndex | 0
        st.done.tables[ti] = true
        const row = tableDefs().find((x) => (x.tableIndex | 0) === ti)
        showToast(`Won: ${row ? row.name : 'Table cup'}`, `Fantasy prize: ${row ? row.prize : ''}`, 4500)
      }
      st.run = null
      writeState(st)
      renderList()
      updateStrip(null)
      return
    }

    if (run.losses >= winsToClinch()) {
      const title = 'Series lost'
      const sub =
        run.scope === 'lifetime'
          ? `${lifeDef().name} — house wins the series. Try again anytime.`
          : `Table cup — try again when ready.`
      st.run = null
      writeState(st)
      showToast(title, sub, 4000)
      renderList()
      updateStrip(null)
      return
    }

    writeState(st)
    updateStrip(run)
  }

  function resetAll() {
    try {
      localStorage.removeItem(STORAGE_STATE)
      localStorage.removeItem(LEGACY_DONE)
      localStorage.removeItem(LEGACY_RUN)
    } catch {
      /* ignore */
    }
    renderList()
  }

  function noDouble() {
    return !!readState().run && !isGuest()
  }

  function wire() {
    const root = document.getElementById('d21TournamentList')
    if (root && !root._d21TournamentDelegation) {
      root._d21TournamentDelegation = true
      root.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-tournament-kind]')
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
      const st = readState()
      st.run = null
      writeState(st)
      updateStrip(null)
    }
    init()
  }

  window.__d21TournamentAfterHand = afterHand
  window.__d21TournamentNoDouble = noDouble
  window.__d21TournamentReset = resetAll
  window.__d21TournamentGetTrophyFlags = getTrophyFlags

  function d21TournamentDevAllowed() {
    try {
      if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('d21dev') === '1') {
        return true
      }
      if (typeof localStorage !== 'undefined' && localStorage.getItem('d21dev') === '1') {
        return true
      }
    } catch (_) {
      /* ignore */
    }
    return false
  }

  function bumpLifetimeStatsToMeetGate() {
    const L = lifeDef()
    const minH = L.minHands | 0
    const minW = L.minWon | 0
    let j = {}
    try {
      j = JSON.parse(localStorage.getItem('dice21_lifetime_v1') || '{}')
    } catch (_) {
      j = {}
    }
    const hands = Math.max(+j.hands || 0, minH)
    const won = Math.max(+j.won || 0, minW)
    try {
      localStorage.setItem(
        'dice21_lifetime_v1',
        JSON.stringify({
          net: +j.net || 0,
          won,
          lost: +j.lost || 0,
          hands,
        })
      )
    } catch (_) {
      /* ignore */
    }
  }

  function meetTableGates(tableIndex) {
    const ti = tableIndex | 0
    const row = tableDefs().find((x) => (x.tableIndex | 0) === ti)
    if (!row) return false
    const st = readState()
    const k = String(ti)
    const cur = st.perTable[k] || { h: 0, w: 0 }
    st.perTable[k] = {
      h: Math.max(cur.h | 0, row.minHands | 0),
      w: Math.max(cur.w | 0, row.minWon | 0),
    }
    writeState(st)
    return true
  }

  function devMeetGates(opts) {
    if (!d21TournamentDevAllowed()) {
      console.warn('[d21 dev] Enable: ?d21dev=1 or localStorage.setItem("d21dev","1")')
      return
    }
    if (isGuest()) {
      console.warn('[d21 dev] Not available in guest/watch mode.')
      return
    }
    const o = opts || {}
    if (o.lifetime) bumpLifetimeStatsToMeetGate()
    if (o.table !== undefined && o.table !== null) meetTableGates(+o.table)
    renderList()
    syncTrophy3D()
  }

  function devStartSeries(opts) {
    if (!d21TournamentDevAllowed()) {
      console.warn('[d21 dev] Enable: ?d21dev=1 or localStorage.setItem("d21dev","1")')
      return
    }
    if (isGuest()) {
      console.warn('[d21 dev] Not available in guest/watch mode.')
      return
    }
    const o = opts || {}
    const scope = o.scope
    const st = readState()
    const wins = o.wins | 0
    const losses = o.losses | 0
    if (scope === 'lifetime') {
      st.run = { scope: 'lifetime', wins, losses }
    } else if (scope === 'table') {
      st.run = { scope: 'table', tableIndex: o.tableIndex | 0, wins, losses }
    } else {
      console.warn(
        '[d21 dev] __d21TournamentDevStartSeries({ scope: "lifetime"|"table", tableIndex?, wins?, losses? })'
      )
      return
    }
    writeState(st)
    updateStrip(st.run)
    renderList()
    syncTrophy3D()
  }

  function devMarkCleared(opts) {
    if (!d21TournamentDevAllowed()) {
      console.warn('[d21 dev] Enable: ?d21dev=1 or localStorage.setItem("d21dev","1")')
      return
    }
    if (isGuest()) {
      console.warn('[d21 dev] Not available in guest/watch mode.')
      return
    }
    const o = opts || {}
    const st = readState()
    if (o.lifetime) st.done.lifetime = true
    if (Array.isArray(o.tables)) {
      for (const t of o.tables) {
        const ti = +t
        if (ti >= 0 && ti < st.done.tables.length) st.done.tables[ti] = true
      }
    }
    writeState(st)
    renderList()
    syncTrophy3D()
  }

  function devTournamentHelp() {
    console.info(`[d21 dev] Tournament testing (host only)

Enable once:
  ?d21dev=1   on the URL, or
  localStorage.setItem("d21dev","1"); location.reload()

Meet entry gates (then use "Play for prize" in the panel):
  __d21TournamentDevMeetGates({ lifetime: true })
  __d21TournamentDevMeetGates({ table: 0 })   // 0–3 = Club … Pinnacle

Jump into an active series without entering from UI:
  __d21TournamentDevStartSeries({ scope: "lifetime", wins: 1, losses: 0 })
  __d21TournamentDevStartSeries({ scope: "table", tableIndex: 0, wins: 0, losses: 0 })

Mark cleared (e.g. 3D trophy chips) without playing:
  __d21TournamentDevMarkCleared({ lifetime: true, tables: [0, 1] })
`)
  }

  window.__d21TournamentDevMeetGates = devMeetGates
  window.__d21TournamentDevStartSeries = devStartSeries
  window.__d21TournamentDevMarkCleared = devMarkCleared
  window.__d21TournamentDevHelp = devTournamentHelp
  if (d21TournamentDevAllowed()) {
    console.info('[d21 dev] Tournament helpers ready — __d21TournamentDevHelp()')
  }

  window.addEventListener('d21-ready', init)
  window.addEventListener('d21-rolechange', onRoleChange)
  window.addEventListener('d21-table', renderList)
  window.addEventListener('storage', (e) => {
    if (e.key === 'dice21_lifetime_v1' || e.key === STORAGE_STATE) renderList()
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
