/**
 * WebSocket multiplayer relay for Poker Dice + Dice 21 (port 8788).
 * Run: npm run mp-server   (and npm run dev in another terminal)
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
import { WebSocketServer } from 'ws'
import { randomInt, randomUUID } from 'crypto'

const PORT = Number(process.env.PORT || 8788)

/** @type {Map<string, { host: import('ws').WebSocket | null, guest: import('ws').WebSocket | null, seed: number, hostTurn: boolean, rollNonce: number }>} */
const rooms = new Map()

/** @type {Map<string, { code: string, role: 'host' | 'guest' }>} */
const sessions = new Map()

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[randomInt(chars.length)]
  return code
}

function ensureRoom(code) {
  let r = rooms.get(code)
  if (!r) {
    r = { host: null, guest: null, seed: randomInt(1, 2 ** 31 - 1), hostTurn: true, rollNonce: 0 }
    rooms.set(code, r)
  }
  return r
}

function peerFor(ws, room) {
  if (room.host === ws) return room.guest
  if (room.guest === ws) return room.host
  return null
}

function send(ws, obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj))
}

function sendTurn(room) {
  if (!room.host || !room.guest) return
  send(room.host, { type: 'turn', you: room.hostTurn })
  send(room.guest, { type: 'turn', you: !room.hostTurn })
}

function broadcastPeer(room, here) {
  const payload = { type: 'peer', here: !!here }
  send(room.host, payload)
  send(room.guest, payload)
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rollFivePoker(seed, room, round, rollInRound, rid) {
  const salt =
    (seed ^ room.rollNonce * 0x9e3779b9 ^ round * 0x1f1f1f1f ^ rollInRound * 0x27d4eb2d ^ hashStr(rid)) >>> 0
  room.rollNonce = (room.rollNonce + 1) % 1e9
  const rng = mulberry32(salt)
  return Array.from({ length: 5 }, () => 1 + Math.floor(rng() * 6))
}

function hashStr(s) {
  let h = 0
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return h >>> 0
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  /** @type {{ code?: string, role?: 'host'|'guest', sessionId?: string }} */
  const client = {}

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }
    const type = msg && msg.type
    if (!type) return

    switch (type) {
      case 'create': {
        let code = genCode()
        let guard = 0
        while (rooms.has(code) && guard++ < 500) code = genCode()
        if (rooms.has(code)) {
          send(ws, { type: 'error', message: 'Could not allocate room' })
          return
        }
        const room = ensureRoom(code)
        if (room.host) {
          send(ws, { type: 'error', message: 'Could not allocate room' })
          return
        }
        room.host = ws
        client.code = code
        client.role = 'host'
        const sessionId = randomUUID()
        client.sessionId = sessionId
        sessions.set(sessionId, { code, role: 'host' })
        send(ws, { type: 'created', code })
        send(ws, { type: 'session', sessionId })
        break
      }
      case 'join': {
        const code = String(msg.code || '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
        if (code.length !== 4) {
          send(ws, { type: 'error', message: 'Invalid room code' })
          return
        }
        const room = rooms.get(code)
        if (!room || !room.host) {
          send(ws, { type: 'error', message: 'Room not found' })
          return
        }
        if (room.guest) {
          send(ws, { type: 'error', message: 'Room is full' })
          return
        }
        room.guest = ws
        client.code = code
        client.role = 'guest'
        const sessionId = randomUUID()
        client.sessionId = sessionId
        sessions.set(sessionId, { code, role: 'guest' })
        send(ws, { type: 'joined', code })
        send(ws, { type: 'session', sessionId })
        broadcastPeer(room, true)
        send(room.host, { type: 'match_seed', seed: room.seed })
        send(room.guest, { type: 'match_seed', seed: room.seed })
        sendTurn(room)
        break
      }
      case 'reconnect': {
        const sessionId = String(msg.sessionId || '')
        const rec = sessions.get(sessionId)
        if (!rec) {
          send(ws, { type: 'error', message: 'Unknown session' })
          return
        }
        const room = ensureRoom(rec.code)
        client.sessionId = sessionId
        client.code = rec.code
        client.role = rec.role
        if (rec.role === 'host') room.host = ws
        else room.guest = ws
        send(ws, { type: 'reconnect_ok', code: rec.code })
        send(ws, { type: 'session', sessionId })
        send(ws, { type: 'match_seed', seed: room.seed })
        if (room.host && room.guest) {
          broadcastPeer(room, true)
          sendTurn(room)
        }
        break
      }
      case 'roll': {
        const code = client.code
        if (!code) return
        const room = rooms.get(code)
        if (!room) return
        const rid = msg.rid
        const round = Number(msg.round)
        const rollInRound = Number(msg.rollInRound)
        if (!rid || !Number.isFinite(round) || !Number.isFinite(rollInRound)) return
        const values = rollFivePoker(room.seed, room, round, rollInRound, rid)
        send(ws, { type: 'roll', rid, values })
        const other = peerFor(ws, room)
        if (other) {
          send(other, {
            type: 'opp_roll',
            round,
            rollInRound,
            values,
          })
        }
        break
      }
      case 'round': {
        const code = client.code
        if (!code) return
        const room = rooms.get(code)
        const other = room && peerFor(ws, room)
        if (other) {
          send(other, {
            type: 'opp_round',
            round: msg.round,
            points: msg.points,
            total: msg.total,
          })
        }
        break
      }
      case 'round_end': {
        const code = client.code
        if (!code) return
        const room = rooms.get(code)
        const other = room && peerFor(ws, room)
        if (other) {
          send(other, { type: 'round_unlock', completedRound: msg.round })
        }
        if (room && room.host && room.guest) {
          room.hostTurn = !room.hostTurn
          sendTurn(room)
        }
        break
      }
      case 'd21': {
        const code = client.code
        if (!code) return
        const room = rooms.get(code)
        const other = room && peerFor(ws, room)
        if (other) send(other, msg)
        break
      }
      default:
        break
    }
  })

  ws.on('close', () => {
    const code = client.code
    if (!code) return
    const room = rooms.get(code)
    if (!room) return
    const peerWs = peerFor(ws, room)
    if (room.host === ws) room.host = null
    if (room.guest === ws) room.guest = null
    if (peerWs) {
      send(peerWs, { type: 'opp_left' })
      send(peerWs, { type: 'peer', here: false })
    }
    if (!room.host && !room.guest) rooms.delete(code)
  })
})

console.log(`mp-server listening on ws://localhost:${PORT}`)
