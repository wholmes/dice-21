/**
 * Mobile layout: corner docks move into a bottom sheet; quick bar keeps play + tools reachable.
 * Also persists collapsible UI (Lifetime / Badges details, rules panel) in localStorage.
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
const MQ = '(max-width: 640px)'

const LS = {
  lifeDetails: 'd21_ui_lifeDetails_open',
  achDetails: 'd21_ui_achDetails_open',
  panelHelp: 'd21_ui_panelHelp_open',
}

function $(id) {
  return document.getElementById(id)
}

function readStoredTriState(key) {
  try {
    const v = localStorage.getItem(key)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

function writeStoredBool(key, open) {
  try {
    localStorage.setItem(key, open ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function applyDetailsPersistence() {
  const pairs = [
    ['lifeDetails', LS.lifeDetails],
    ['achDetails', LS.achDetails],
  ]
  for (const [id, key] of pairs) {
    const el = document.getElementById(id)
    if (!el) continue
    const saved = readStoredTriState(key)
    if (saved !== null) el.open = saved
    el.addEventListener('toggle', () => writeStoredBool(key, el.open))
  }
}

function setPanelHelpOpen(open) {
  const help = $('panelHelpBody')
  const toggle = $('panelHelpToggle')
  if (!help || !toggle) return
  help.hidden = !open
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  toggle.textContent = open ? '−' : '+'
}

function wirePanelHelpPersistence() {
  const help = $('panelHelpBody')
  const toggle = $('panelHelpToggle')
  if (!help || !toggle) return
  const persist = () => writeStoredBool(LS.panelHelp, !help.hidden)
  toggle.addEventListener('click', () => requestAnimationFrame(persist))
}

function isMobileLayout() {
  return window.matchMedia(MQ).matches
}

function setMobileClass() {
  const m = isMobileLayout()
  document.documentElement.classList.toggle('is-mobile-ui', m)
  const bar = $('mobileQuickBar')
  if (bar) bar.setAttribute('aria-hidden', m ? 'false' : 'true')
}

function restoreDocks(app, ui) {
  const chipDock = $('chipDock')
  const feltDock = $('feltDock')
  if (!chipDock || !feltDock || !app || !ui) return
  chipDock.classList.remove('in-mobile-sheet')
  feltDock.classList.remove('in-mobile-sheet')
  if (chipDock.parentNode !== app) app.insertBefore(chipDock, ui)
  if (feltDock.parentNode !== app) app.insertBefore(feltDock, ui)
}

function closeSheet() {
  const sheet = $('mobileSheet')
  const backdrop = $('mobileSheetBackdrop')
  const app = $('app')
  const ui = $('ui')
  if (sheet) {
    sheet.hidden = true
    sheet.setAttribute('aria-hidden', 'true')
  }
  if (backdrop) {
    backdrop.hidden = true
    backdrop.setAttribute('aria-hidden', 'true')
  }
  restoreDocks(app, ui)
  document.body.style.overflow = ''
}

function openSheet(mode) {
  const chipDock = $('chipDock')
  const feltDock = $('feltDock')
  const sheet = $('mobileSheet')
  const sheetBody = $('mobileSheetBody')
  const sheetTitle = $('mobileSheetTitle')
  const backdrop = $('mobileSheetBackdrop')
  const app = $('app')
  const ui = $('ui')
  if (!chipDock || !feltDock || !sheet || !sheetBody || !sheetTitle) return

  restoreDocks(app, ui)
  sheetBody.innerHTML = ''

  if (mode === 'bet') {
    sheetTitle.textContent = 'Bet'
    chipDock.classList.add('in-mobile-sheet')
    sheetBody.appendChild(chipDock)
  } else if (mode === 'table') {
    sheetTitle.textContent = 'Table'
    feltDock.classList.add('in-mobile-sheet')
    sheetBody.appendChild(feltDock)
  }

  sheet.hidden = false
  sheet.setAttribute('aria-hidden', 'false')
  if (backdrop) {
    backdrop.hidden = false
    backdrop.setAttribute('aria-hidden', 'false')
  }
  document.body.style.overflow = 'hidden'
  $('mobileSheetClose')?.focus()
}

function syncPanelHelpToLayout() {
  if (isMobileLayout()) {
    setPanelHelpOpen(false)
  } else {
    const saved = readStoredTriState(LS.panelHelp)
    if (saved !== null) setPanelHelpOpen(saved)
  }
}

function init() {
  closeSheet()
  applyDetailsPersistence()

  setMobileClass()
  syncPanelHelpToLayout()
  wirePanelHelpPersistence()

  const bar = $('mobileQuickBar')
  const backdrop = $('mobileSheetBackdrop')
  const closeBtn = $('mobileSheetClose')
  if (!bar) return

  window.matchMedia(MQ).addEventListener('change', () => {
    setMobileClass()
    if (!isMobileLayout()) closeSheet()
    syncPanelHelpToLayout()
  })

  $('mqaBet')?.addEventListener('click', () => {
    if (!isMobileLayout()) return
    openSheet('bet')
  })
  $('mqaTable')?.addEventListener('click', () => {
    if (!isMobileLayout()) return
    openSheet('table')
  })
  $('mqaOnline')?.addEventListener('click', () => {
    if (!isMobileLayout()) return
    closeSheet()
    requestAnimationFrame(() => $('d21mpTrigger')?.click())
  })
  $('mqaMore')?.addEventListener('click', () => {
    if (!isMobileLayout()) return
    const help = $('panelHelpBody')
    const toggle = $('panelHelpToggle')
    if (help) help.hidden = false
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true')
      toggle.textContent = '−'
    }
    writeStoredBool(LS.panelHelp, true)
    $('ui')?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    help?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  backdrop?.addEventListener('click', closeSheet)
  closeBtn?.addEventListener('click', closeSheet)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('mobileSheet')?.hidden) closeSheet()
  })

}

init()
