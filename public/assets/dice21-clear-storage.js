/**
 * Dice 21 — reset persisted browser state for this origin.
 *
 * - d21ClearAllLocalStorageAndReload() — removes every key in localStorage (full wipe for this site) and reloads.
 * - d21ClearDice21KeysAndReload() — removes only known Dice 21 keys and reloads (leaves unrelated keys if any).
 *
 * Camera: the game saves the orbit on `pagehide` before unload. A raw `localStorage.clear()` then
 * `location.reload()` can restore `dice21_camera_view_v1`. These helpers set
 * `sessionStorage` key `d21_skip_cam_pagehide_once` and call `__d21CamViewClearSaved` when loaded.
 *
 * Manual DevTools wipe (same idea):
 *   sessionStorage.setItem('d21_skip_cam_pagehide_once', '1');
 *   __d21CamViewClearSaved && __d21CamViewClearSaved();
 *   localStorage.clear();
 *   location.reload();
 *
 * From the browser console: d21ClearAllLocalStorageAndReload()
 *
 * Copyright © Whittfield Holmes. All rights reserved.
 */
;(function () {
  const DICE21_KEYS = [
    'dice21_achievements_v1',
    'dice21_amb_dj',
    'dice21_camera_view_v1',
    'dice21_drink_v1',
    'dice21_felt_i',
    'dice21_lifetime_v1',
    'dice21_mode_v1',
    'dice21_room_amb',
    'dice21_server_hint_shown_v1',
    'dice21_server_used_v1',
    'dice21_shake_hint_overlay',
    'dice21_table_session_v1',
    'dice21_tournament_done',
    'dice21_tournament_run',
    'dice21_tournament_state_v1',
    'd21_ui_lifeDetails_open',
    'd21_ui_achDetails_open',
    'd21_ui_panelHelp_open',
    'd21_ui_badgeOverlay_open',
  ]

  function reload() {
    try {
      location.reload()
    } catch (_) {
      /* ignore */
    }
  }

  function setSkipCameraSaveOnUnload() {
    try {
      sessionStorage.setItem('d21_skip_cam_pagehide_once', '1')
    } catch (_) {
      /* ignore */
    }
  }

  window.d21ClearAllLocalStorageAndReload = function () {
    setSkipCameraSaveOnUnload()
    try {
      if (typeof window.__d21CamViewClearSaved === 'function') {
        window.__d21CamViewClearSaved()
      }
    } catch (_) {
      /* main bundle may not be loaded yet */
    }
    try {
      localStorage.clear()
    } catch (e) {
      console.warn('d21ClearAllLocalStorageAndReload', e)
    }
    reload()
  }

  window.d21ClearDice21KeysAndReload = function () {
    setSkipCameraSaveOnUnload()
    try {
      if (typeof window.__d21CamViewClearSaved === 'function') {
        window.__d21CamViewClearSaved()
      }
    } catch (_) {
      /* ignore */
    }
    for (const k of DICE21_KEYS) {
      try {
        localStorage.removeItem(k)
      } catch (_) {
        /* ignore */
      }
    }
    reload()
  }
})()
