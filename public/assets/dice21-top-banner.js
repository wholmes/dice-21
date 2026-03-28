/**
 * Dice 21 — top casino sign (two-word marquee + optional subline).
 *
 *   window.d21SetTopBanner("Dice", "Casino")
 *   window.d21SetTopBanner("Dice", "Casino", "Tournament Sunday")
 *   window.d21SetTopBanner("Dice Casino", "optional subline")  // splits on first space
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function (w) {
  function splitTwoWords(full) {
    var s = String(full != null ? full : '').trim()
    var i = s.indexOf(' ')
    if (i <= 0) return { first: s, second: '' }
    return { first: s.slice(0, i).trim(), second: s.slice(i + 1).trim() }
  }

  function d21SetTopBanner(a, b, c) {
    var nameEl = document.getElementById('d21TopBannerName')
    var gameEl = document.getElementById('d21TopBannerGame')
    var subEl = document.getElementById('d21TopBannerSub')
    var name
    var game
    var sub

    if (arguments.length >= 3) {
      name = a
      game = b
      sub = c
    } else if (arguments.length === 2) {
      var full = String(a != null ? a : '').trim()
      var sp = splitTwoWords(full)
      if (sp.second) {
        name = sp.first
        game = sp.second
      } else {
        name = sp.first
        game = 'Casino'
      }
      sub = b
    } else {
      var one = String(a != null ? a : '').trim()
      var sp1 = splitTwoWords(one)
      if (sp1.second) {
        name = sp1.first
        game = sp1.second
      } else {
        name = sp1.first
        game = 'Casino'
      }
      sub = undefined
    }

    if (nameEl) nameEl.textContent = name != null ? String(name) : ''
    if (gameEl) gameEl.textContent = game != null ? String(game) : 'Casino'
    if (subEl) {
      if (sub != null && String(sub).trim() !== '') {
        subEl.textContent = String(sub)
        subEl.hidden = false
      } else {
        subEl.textContent = ''
        subEl.hidden = true
      }
    }
  }

  w.d21SetTopBanner = d21SetTopBanner
})(typeof window !== 'undefined' ? window : globalThis)
