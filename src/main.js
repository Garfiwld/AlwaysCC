/**
 * AlwaysCC – bootstrap. Runs applyPreferences() on load and on YouTube's
 * in-page (SPA) navigations.
 */

// Initial run + a couple of retries in case the player / menu loads late.
setTimeout(applyPreferences, 2000);
setTimeout(applyPreferences, 5000);

// Re-run on in-page navigation.
new MutationObserver(() => {
  if (location.href === AlwaysCC.lastUrl) return;
  AlwaysCC.lastUrl = location.href;
  AlwaysCC.captionsEnabledForCurrentVideo = false;
  AlwaysCC.audioTrackSetForCurrentVideo = false;
  setTimeout(applyPreferences, 2000);
  setTimeout(applyPreferences, 5000);
}).observe(document, { subtree: true, childList: true });
