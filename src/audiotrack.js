/**
 * AlwaysCC – preferred audio-track selection.
 *
 * pickAudioTrack() assumes the settings menu is already open at its root panel
 * (apply.js owns opening/closing). It calls done(changed) where `changed` is
 * true only if it actually switched the track (which makes YouTube reload the
 * player).
 */
function pickAudioTrack(settingsButton, done) {
  const lang = AlwaysCC.preferredLanguage;
  console.log(`Selecting audio track: ${lang}`);

  let audioTrackMenuItem = null;
  for (const item of document.querySelectorAll('.ytp-menuitem')) {
    if (item.textContent.trim().includes('Audio track')) {
      audioTrackMenuItem = item;
      break;
    }
  }

  if (!audioTrackMenuItem) {
    console.log("Audio track menu item not found (single-track video?)");
    return done(false);
  }

  activateMenuItem(audioTrackMenuItem);

  setTimeout(() => {
    const panelTitle = document.querySelector('.ytp-panel-title');
    const titleText = panelTitle ? panelTitle.textContent.trim() : '';
    if (titleText !== 'Audio track') {
      console.log(`Expected "Audio track" panel, got "${titleText}"; aborting`);
      return done(false);
    }

    const panel = panelTitle.closest('.ytp-panel') || document;
    const options = panel.querySelectorAll('.ytp-menuitem[role="menuitemradio"]');

    let match = null;
    for (const option of options) {
      const label = (option.querySelector('.ytp-menuitem-label') || option)
        .textContent.trim();
      if (label.includes(lang)) {
        match = option;
        break;
      }
    }

    if (!match) {
      console.log(`Audio track for ${lang} not found`);
      return done(false);
    }

    if (match.getAttribute('aria-checked') === 'true') {
      console.log(`Audio track already set to ${match.textContent.trim()}`);
      return done(false);
    }

    activateMenuItem(match);
    console.log(`Activated audio track: ${match.textContent.trim()}`);

    setTimeout(() => {
      if (match.getAttribute('aria-checked') !== 'true') {
        console.log("Audio track not applied, retrying via keyboard");
        activateMenuItemViaKeyboard(match);
      }
      done(true);
    }, 400);
  }, 300);
}
