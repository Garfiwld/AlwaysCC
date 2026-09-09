/**
 * AlwaysCC – shared state & config.
 *
 * Every file listed in manifest `content_scripts.js` runs in the same isolated
 * world and shares the global scope, so this namespace object (declared with
 * `var`, not `let`/`const`) is visible to all of them. Keep cross-file mutable
 * state here rather than in per-file top-level bindings.
 */
var AlwaysCC = {
  // ----- Config (synced from chrome.storage.sync) -----
  preferredLanguage: "Thai",   // subtitle language AND audio-track language
  extensionEnabled: true,      // the CC auto-enable toggle (audio track ignores this)

  // ----- Per-video / runtime tracking -----
  captionsEnabledForCurrentVideo: false,
  audioTrackSetForCurrentVideo: false,
  currentVideoId: "",
  lastUrl: location.href,

  // True while the subtitle pass owns the settings menu. The audio-track pass
  // waits for this to clear so the two don't fight over the same menu.
  settingsMenuBusy: false
};
