/**
 * Tap-to-start gate: preload audio assets, then enable "Tap to play".
 * Click calls window.d21EnterGame() — applies viewport/camera and starts the render loop (d21-ready from main chunk).
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const gate = document.getElementById('d21StartGate')
  const statusEl = document.getElementById('d21StartStatus')
  const btn = document.getElementById('d21StartBtn')
  if (!gate || !btn) return

  /** Resolve paths relative to site root: page lives under /dice-21/, audio and assets are siblings (../audio, ../assets). */
  function publicUrl(rel) {
    const clean = rel.replace(/^\//, '')
    return new URL('../' + clean, document.baseURI).href
  }

  function preloadAudio() {
    const manifestUrl = publicUrl('audio/dj/manifest.json')
    return fetch(manifestUrl)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((j) => {
        const urls = [manifestUrl]
        const files = Array.isArray(j.files) ? j.files : []
        for (const f of files) {
          urls.push(publicUrl('audio/dj/' + encodeURIComponent(f)))
        }
        const extra = [
          'audio/freesound_community-dice-shake-102631.wav',
          'audio/freesound_community-casino-ambiance-19130.wav',
          'audio/freesound_community-dry-dices-38579.wav',
          'audio/freesound_community-dry-dices-solo-38579.wav',
        ]
        for (const p of extra) urls.push(publicUrl(p))
        return urls
      })
      .catch(() => [])
      .then((urls) =>
        Promise.all(urls.map((u) => fetch(u, { cache: 'force-cache' }).catch(() => null))),
      )
  }

  function enableButton() {
    btn.disabled = false
    if (statusEl) statusEl.textContent = ''
    try {
      btn.focus()
    } catch {
      /* ignore */
    }
  }

  let bootstrapStarted = false

  function runBootstrap() {
    if (bootstrapStarted) return
    if (typeof window.d21EnterGame !== 'function') return
    bootstrapStarted = true
    window.removeEventListener('d21-ready', onReady)
    if (pollId != null) {
      clearInterval(pollId)
      pollId = null
    }
    if (statusEl) statusEl.textContent = 'Loading audio…'
    preloadAudio()
      .then(() => enableButton())
      .catch(() => enableButton())
  }

  function onReady() {
    runBootstrap()
  }

  let pollId = null

  function wire() {
    if (typeof window.d21EnterGame === 'function') {
      runBootstrap()
      return
    }
    window.addEventListener('d21-ready', onReady, { once: true })
    pollId = window.setInterval(() => {
      if (typeof window.d21EnterGame === 'function') runBootstrap()
    }, 40)
  }

  wire()

  btn.addEventListener('click', () => {
    if (typeof window.d21EnterGame !== 'function' || btn.disabled) return
    gate.hidden = true
    gate.setAttribute('aria-hidden', 'true')
    document.body.classList.add('d21-game-started')
    window.d21EnterGame()
  })
})()
