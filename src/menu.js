/**
 * AlwaysCC – helpers for driving YouTube's player settings menu.
 */

// Activates a YouTube player menu item. A plain .click() is silently ignored by
// some panels (notably the audio-track radio options), so dispatch the full
// pointer/mouse sequence at the element's centre.
function activateMenuItem(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const base = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2
  };

  for (const type of ['pointerover', 'pointerenter', 'pointermove',
                      'pointerdown', 'mousedown',
                      'pointerup', 'mouseup', 'click']) {
    const Ctor = type.startsWith('pointer') && window.PointerEvent
      ? PointerEvent : MouseEvent;
    el.dispatchEvent(new Ctor(type, { ...base, pointerId: 1, isPrimary: true }));
  }
}

// Keyboard activation, as a fallback when activateMenuItem() doesn't take.
function activateMenuItemViaKeyboard(el) {
  if (!el) return;
  if (typeof el.focus === 'function') el.focus();
  for (const type of ['keydown', 'keypress', 'keyup']) {
    el.dispatchEvent(new KeyboardEvent(type, {
      bubbles: true, cancelable: true, key: 'Enter', code: 'Enter',
      keyCode: 13, which: 13
    }));
  }
}

// Brings the video to the desired play state. Prefers the player's own
// play/pause button (per request); falls back to the <video> element.
// Returns true if it changed anything.
function setVideoPaused(wantPaused) {
  const video = document.querySelector('video');
  if (!video) return false;
  if (video.paused === wantPaused) return false;

  const btn = document.querySelector('.ytp-play-button');
  if (btn) {
    activateMenuItem(btn);
  } else if (wantPaused) {
    video.pause();
  } else {
    video.play();
  }
  return true;
}

// Ensures the settings menu is open (clicking an already-open one would close
// it), then calls cb once its contents have had time to render.
function openSettingsMenu(settingsButton, cb) {
  if (settingsButton.getAttribute('aria-expanded') !== 'true') {
    activateMenuItem(settingsButton);
    console.log("Opened settings menu");
  }
  setTimeout(cb, 320);
}

// Returns the visible .ytp-panel whose title matches `re`, or null. Used to
// scope option queries to the panel that's actually showing (both the root
// panel's rows and every submenu's rows stay in the DOM).
function settingsPanelByTitle(re) {
  for (const title of document.querySelectorAll('.ytp-settings-menu .ytp-panel-title')) {
    if (title.offsetParent !== null && re.test(title.textContent.trim())) {
      return title.closest('.ytp-panel');
    }
  }
  const first = document.querySelector('.ytp-panel-title');
  return first && re.test(first.textContent.trim()) ? first.closest('.ytp-panel') : null;
}

// Ensures the settings menu is open AND showing its root panel (steps back out
// of any submenu a previous action left it in), then calls cb.
function ensureSettingsRoot(settingsButton, cb) {
  openSettingsMenu(settingsButton, () => {
    const back = document.querySelector('.ytp-settings-menu .ytp-panel-back-button');
    if (back && back.offsetParent !== null) {
      activateMenuItem(back);
      console.log("Stepped back to settings root panel");
      setTimeout(cb, 350);
    } else {
      cb();
    }
  });
}

// Closes the settings panel if it's still open. Checks the button's own
// aria-expanded state rather than looking for .ytp-settings-menu in the DOM,
// since that element can stay present-but-hidden after YouTube closes the panel
// on its own — relying on it made this click() re-open an already-closed menu.
//
// Also releases the settingsMenuBusy lock (apply.js closes the menu here when a
// run finishes).
function closeSettingsMenu(settingsButton) {
  AlwaysCC.settingsMenuBusy = false;

  if (settingsButton.getAttribute('aria-expanded') === 'true') {
    activateMenuItem(settingsButton);
    console.log("Settings menu still open (aria-expanded=true), closing it");
  }
}
