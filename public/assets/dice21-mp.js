/**
 * Dice 21 — two-player over the same WebSocket server as Poker Dice (port 8788).
 * Host plays the full game; guest spectates with live HUD sync (same room protocol).
 */
const SESSION_KEY = 'd21_mp_session'
const ROOM_KEY = 'd21_mp_room'
const ROLE_KEY = 'd21_mp_role'

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.hostname}:8788`
}

let socket = null
let peerConnected = false
let broadcastId = 0
let popoverOpen = false

function $(id) {
  return document.getElementById(id)
}

function setPopoverOpen(open) {
  popoverOpen = open
  const pop = $('d21mpPopover')
  const tr = $('d21mpTrigger')
  if (pop) {
    pop.hidden = !open
    pop.setAttribute('aria-hidden', open ? 'false' : 'true')
  }
  if (tr) tr.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function syncTrigger() {
  const label = $('d21mpTriggerLabel')
  const trigger = $('d21mpTrigger')
  const st = $('d21mpStatus')
  if (!label || !trigger) return
  const code = ($('d21mpCode')?.textContent || '').trim()
  const open = socket && socket.readyState === WebSocket.OPEN
  let t = 'Multiplayer'
  if (open) {
    if (peerConnected && code) {
      t = window.__d21Role === 'guest' ? `Watch · ${code}` : `Live · ${code}`
    } else if (code) {
      t = `Room · ${code}`
    } else {
      t = '…'
    }
  }
  label.textContent = t
  trigger.classList.toggle('is-live', peerConnected)
  trigger.classList.toggle('is-warn', !!st?.classList.contains('mp-warn'))
}

function setStatus(text, cls) {
  const el = $('d21mpStatus')
  if (!el) return
  el.textContent = text
  el.classList.remove('mp-ok', 'mp-warn')
  if (cls) el.classList.add(cls)
  syncTrigger()
}

function setRole(role) {
  if (!role) {
    window.__d21Role = undefined
    try {
      sessionStorage.removeItem(ROLE_KEY)
    } catch {
      /* ignore */
    }
    applyGuestChrome(false)
    syncTrigger()
    return
  }
  window.__d21Role = role
  try {
    sessionStorage.setItem(ROLE_KEY, role)
  } catch {
    /* ignore */
  }
  applyGuestChrome(role === 'guest')
  syncTrigger()
}

function applyGuestChrome(isGuest) {
  const sel = [
    '#btnDeal',
    '#btnBetDock',
    '#btnHit',
    '#btnStand',
    '#gameMode',
    '.chip-btn',
    '.felt-swatch',
    '#btnResetProgress',
  ].join(',')
  document.querySelectorAll(sel).forEach((el) => {
    if (el) el.disabled = !!isGuest
  })
  const hint = $('d21mpSpectate')
  if (hint) hint.hidden = !isGuest
}

function readHud() {
  return {
    playerTotal: $('playerTotal')?.textContent ?? '',
    aiTotal: $('aiTotal')?.textContent ?? '',
    potVal: $('potVal')?.textContent ?? '',
    chipsYou: $('chipsYou')?.textContent ?? '',
    chipsAi: $('chipsAi')?.textContent ?? '',
    message: $('message')?.textContent ?? '',
    ruleHint: $('ruleHint')?.textContent ?? '',
    lifeSummary: $('lifeSummary')?.textContent ?? '',
  }
}

function applyHud(hud) {
  if (!hud) return
  const map = [
    ['playerTotal', hud.playerTotal],
    ['aiTotal', hud.aiTotal],
    ['potVal', hud.potVal],
    ['chipsYou', hud.chipsYou],
    ['chipsAi', hud.chipsAi],
    ['message', hud.message],
    ['ruleHint', hud.ruleHint],
    ['lifeSummary', hud.lifeSummary],
  ]
  for (const [id, val] of map) {
    if (val === undefined) continue
    const el = $(id)
    if (el) el.textContent = val
  }
}

function showRoom(code) {
  const line = $('d21mpRoomLine')
  const codeEl = $('d21mpCode')
  if (line) line.hidden = !code
  if (codeEl) codeEl.textContent = code || ''
  syncTrigger()
}

function send(obj) {
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(obj))
}

function stopBroadcast() {
  if (broadcastId) {
    cancelAnimationFrame(broadcastId)
    broadcastId = 0
  }
}

let lastHud = ''

function tickBroadcast() {
  broadcastId = requestAnimationFrame(tickBroadcast)
  if (window.__d21Role !== 'host' || !peerConnected) return
  const hud = readHud()
  const json = JSON.stringify(hud)
  if (json === lastHud) return
  lastHud = json
  send({ type: 'd21', action: 'hud', hud })
}

function startBroadcast() {
  stopBroadcast()
  lastHud = ''
  tickBroadcast()
}

function onMessage(ev) {
  let msg
  try {
    msg = JSON.parse(ev.data)
  } catch {
    return
  }
  if (msg.type === 'created' && msg.code) {
    try {
      sessionStorage.setItem(ROOM_KEY, msg.code)
    } catch {
      /* ignore */
    }
    showRoom(msg.code)
    setStatus('Room ready — share the code', 'mp-ok')
    return
  }
  if (msg.type === 'joined' && msg.code) {
    try {
      sessionStorage.setItem(ROOM_KEY, msg.code)
    } catch {
      /* ignore */
    }
    showRoom(msg.code)
    setStatus('Joined — waiting for host', 'mp-warn')
    return
  }
  if (msg.type === 'reconnect_ok' && msg.code) {
    showRoom(msg.code)
    setStatus('Reconnected', 'mp-ok')
    return
  }
  if (msg.type === 'session' && msg.sessionId) {
    try {
      sessionStorage.setItem(SESSION_KEY, msg.sessionId)
    } catch {
      /* ignore */
    }
    const rb = $('d21mpReconnectBtn')
    const db = $('d21mpDisconnectBtn')
    if (rb) rb.hidden = false
    if (db) db.hidden = false
    syncTrigger()
    return
  }
  if (msg.type === 'error') {
    setStatus(msg.message || 'Error', 'mp-warn')
    return
  }
  if (msg.type === 'peer') {
    peerConnected = !!msg.here
    if (msg.here) {
      setStatus('Opponent connected', 'mp-ok')
      if (window.__d21Role === 'host') startBroadcast()
    } else {
      peerConnected = false
      stopBroadcast()
      setStatus('Opponent disconnected — solo play', 'mp-warn')
    }
    return
  }
  if (msg.type === 'opp_left') {
    peerConnected = false
    stopBroadcast()
    setStatus('Opponent left', 'mp-warn')
    return
  }
  if (msg.type === 'd21' && msg.action === 'hud' && msg.hud && window.__d21Role === 'guest') {
    applyHud(msg.hud)
    return
  }
}

function connect() {
  return new Promise((resolve, reject) => {
    try {
      socket = new WebSocket(wsUrl())
    } catch (e) {
      reject(e)
      return
    }
    socket.onopen = () => {
      setStatus('Connected', 'mp-ok')
      resolve()
    }
    socket.onerror = () => {
      setStatus('WebSocket error — is mp-server running?', 'mp-warn')
      reject(new Error('ws'))
    }
    socket.onclose = () => {
      setStatus('Offline — solo play', '')
      peerConnected = false
      stopBroadcast()
      const rb = $('d21mpReconnectBtn')
      const db = $('d21mpDisconnectBtn')
      let sid = null
      try {
        sid = sessionStorage.getItem(SESSION_KEY)
      } catch {
        sid = null
      }
      if (rb) rb.hidden = !sid
      if (db) db.hidden = true
      showRoom('')
      setRole(null)
      syncTrigger()
    }
    socket.onmessage = onMessage
  })
}

function disconnect() {
  stopBroadcast()
  try {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(ROOM_KEY)
    sessionStorage.removeItem(ROLE_KEY)
  } catch {
    /* ignore */
  }
  setRole(null)
  peerConnected = false
  if (socket) {
    socket.close()
    socket = null
  }
  showRoom('')
  setStatus('Offline — solo play', '')
  $('d21mpReconnectBtn') && ($('d21mpReconnectBtn').hidden = true)
  $('d21mpDisconnectBtn') && ($('d21mpDisconnectBtn').hidden = true)
  applyGuestChrome(false)
  syncTrigger()
}

async function doCreate() {
  try {
    await connect()
    setRole('host')
    send({ type: 'create' })
    $('d21mpDisconnectBtn') && ($('d21mpDisconnectBtn').hidden = false)
  } catch {
    setStatus('Could not connect', 'mp-warn')
  }
}

async function doJoin() {
  const input = $('d21mpJoinInput')
  const code = String(input?.value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (code.length !== 4) {
    setStatus('Enter a 4-character room code', 'mp-warn')
    return
  }
  try {
    await connect()
    setRole('guest')
    send({ type: 'join', code })
    $('d21mpDisconnectBtn') && ($('d21mpDisconnectBtn').hidden = false)
  } catch {
    setStatus('Could not connect', 'mp-warn')
  }
}

async function doReconnect() {
  let sid = null
  try {
    sid = sessionStorage.getItem(SESSION_KEY)
  } catch {
    sid = null
  }
  if (!sid) {
    setStatus('No saved session', 'mp-warn')
    return
  }
  try {
    await connect()
    let role = 'host'
    try {
      role = sessionStorage.getItem(ROLE_KEY) || 'host'
    } catch {
      role = 'host'
    }
    setRole(role === 'guest' ? 'guest' : 'host')
    send({ type: 'reconnect', sessionId: sid })
    $('d21mpDisconnectBtn') && ($('d21mpDisconnectBtn').hidden = false)
  } catch {
    setStatus('Could not reconnect', 'mp-warn')
  }
}

function init() {
  const createBtn = $('d21mpCreateBtn')
  const joinBtn = $('d21mpJoinBtn')
  const discBtn = $('d21mpDisconnectBtn')
  const reconBtn = $('d21mpReconnectBtn')
  const joinInput = $('d21mpJoinInput')
  const trigger = $('d21mpTrigger')

  createBtn?.addEventListener('click', () => doCreate())
  joinBtn?.addEventListener('click', () => doJoin())
  discBtn?.addEventListener('click', () => disconnect())
  reconBtn?.addEventListener('click', () => doReconnect())
  joinInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doJoin()
  })

  function onDocPointerDown(e) {
    if (!popoverOpen) return
    const w = $('d21mpWrap')
    if (!w || w.contains(e.target)) return
    setPopoverOpen(false)
  }

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation()
    setPopoverOpen(!popoverOpen)
  })

  /* Capture phase: runs before target; avoids canvas / full-screen layers eating the click */
  document.addEventListener('pointerdown', onDocPointerDown, true)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setPopoverOpen(false)
  })

  let hadSession = false
  try {
    hadSession = !!sessionStorage.getItem(SESSION_KEY)
  } catch {
    hadSession = false
  }
  if (reconBtn) reconBtn.hidden = !hadSession

  setStatus('Offline — solo play', '')
}

init()
