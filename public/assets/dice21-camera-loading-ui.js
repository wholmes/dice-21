/**
 * Slim top bar + label while the camera intro / saved-view ease runs.
 * The main bundle calls window.d21CamLoadingShow / d21CamLoadingHide when present.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  var bar
  var labelEl

  function mount() {
    var existing = document.getElementById('d21CamLoadingBar')
    if (existing) {
      bar = existing
      labelEl = existing.querySelector('.d21CamLoadingBar__label')
      return
    }
    var style = document.createElement('style')
    style.textContent =
      '#d21CamLoadingBar{position:fixed;left:0;right:0;top:0;z-index:10050;pointer-events:none;' +
      'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px 0;' +
      'background:linear-gradient(180deg,rgba(8,10,16,.92) 0%,rgba(8,10,16,.55) 70%,transparent 100%);' +
      'transition:opacity .25s ease,visibility .25s ease}' +
      '#d21CamLoadingBar[hidden]{visibility:hidden;opacity:0}' +
      '#d21CamLoadingBar:not([hidden]){visibility:visible;opacity:1}' +
      '.d21CamLoadingBar__track{width:min(92vw,420px);height:3px;border-radius:999px;' +
      'background:rgba(255,255,255,.08);overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.06) inset}' +
      '.d21CamLoadingBar__fill{height:100%;width:40%;border-radius:999px;' +
      'background:linear-gradient(90deg,rgba(232,200,122,.15),rgba(232,200,122,.95),rgba(232,200,122,.15));' +
      'animation:d21CamLoadInd 1.1s ease-in-out infinite}' +
      '@keyframes d21CamLoadInd{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}' +
      '.d21CamLoadingBar__label{font:500 12px/1.35 ui-sans-serif,system-ui,sans-serif;' +
      'color:rgba(228,232,240,.82);letter-spacing:.02em;text-shadow:0 1px 8px rgba(0,0,0,.6)}'
    document.head.appendChild(style)

    bar = document.createElement('div')
    bar.id = 'd21CamLoadingBar'
    bar.setAttribute('role', 'status')
    bar.setAttribute('aria-live', 'polite')
    bar.setAttribute('aria-busy', 'false')
    bar.hidden = true

    var track = document.createElement('div')
    track.className = 'd21CamLoadingBar__track'
    var fill = document.createElement('div')
    fill.className = 'd21CamLoadingBar__fill'
    track.appendChild(fill)
    labelEl = document.createElement('div')
    labelEl.className = 'd21CamLoadingBar__label'
    labelEl.textContent = ''
    bar.appendChild(track)
    bar.appendChild(labelEl)
    document.body.appendChild(bar)
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
    else fn()
  }

  ready(mount)

  window.d21CamLoadingShow = function (phase) {
    ready(function () {
      mount()
      if (!bar) return
      bar.hidden = false
      bar.setAttribute('aria-busy', 'true')
      if (labelEl) {
        labelEl.textContent =
          phase === 1 ? 'Restoring saved view…' : 'Preparing camera…'
      }
    })
  }

  window.d21CamLoadingHide = function () {
    if (!bar) return
    bar.hidden = true
    bar.setAttribute('aria-busy', 'false')
    if (labelEl) labelEl.textContent = ''
  }
})()
