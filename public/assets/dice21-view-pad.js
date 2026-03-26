/**
 * Corner drag pad: tilt (forward/back) and orbit (side to side) via OrbitControls.
 * Requires window.__d21ViewOrbit from main-BosaNfoM.js (set after 3D init).
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const pad = document.getElementById('d21ViewPad')
  if (!pad) return

  const prefersReduced =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let active = false
  let lastX = 0
  let lastY = 0
  let dragAccum = 0
  let lastTapAt = 0

  /** ~same angular feel as mouse-drag on canvas (orbit uses 2π·Δ/height) */
  const scale = () => {
    const h = Math.max(320, window.innerHeight || 640)
    return (2 * Math.PI) / h
  }

  function apply(dx, dy) {
    const fn = window.__d21ViewOrbit
    if (typeof fn !== 'function') return
    const s = scale()
    fn(dx * s, dy * s)
  }

  function waitAndInit() {
    const gate = document.getElementById('d21StartGate')
    const pastStart = gate ? gate.hidden : true
    if (typeof window.__d21ViewOrbit === 'function' && pastStart) {
      pad.hidden = false
      pad.setAttribute('aria-hidden', 'false')
      return
    }
    requestAnimationFrame(waitAndInit)
  }

  if (prefersReduced) {
    pad.hidden = true
    pad.setAttribute('aria-hidden', 'true')
    return
  }

  waitAndInit()

  pad.addEventListener('pointerdown', (e) => {
    if (prefersReduced) return
    if (e.button !== 0) return
    active = true
    dragAccum = 0
    lastX = e.clientX
    lastY = e.clientY
    try {
      pad.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    pad.classList.add('is-active')
  })

  pad.addEventListener('pointermove', (e) => {
    if (!active) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    dragAccum += Math.abs(dx) + Math.abs(dy)
    lastX = e.clientX
    lastY = e.clientY
    apply(dx, dy)
  })

  function end(e) {
    if (!active) return
    const wasTap = dragAccum < 12
    active = false
    pad.classList.remove('is-active')
    try {
      if (e && pad.hasPointerCapture(e.pointerId)) pad.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (wasTap && e && e.button === 0) {
      const t = Date.now()
      if (t - lastTapAt < 450) {
        if (e.shiftKey && typeof window.__d21CamViewClearSaved === 'function') {
          window.__d21CamViewClearSaved()
        } else if (typeof window.__d21CamViewSave === 'function') {
          window.__d21CamViewSave()
        }
        lastTapAt = 0
      } else {
        lastTapAt = t
      }
    }
  }

  pad.addEventListener('pointerup', end)
  pad.addEventListener('pointercancel', end)
  pad.addEventListener('lostpointercapture', () => {
    active = false
    pad.classList.remove('is-active')
  })
})()
