/**
 * AlwaysCC – load settings from chrome.storage and react to changes.
 */

function loadPreferredSubtitle() {
  chrome.storage.sync.get('preferredSubtitle').then((result) => {
    if (result.preferredSubtitle) {
      AlwaysCC.preferredLanguage = result.preferredSubtitle;
      console.log(`Loaded subtitle preference: ${AlwaysCC.preferredLanguage}`);
    }
  }).catch(error => {
    console.error("Error loading subtitle preference:", error);
  });
}

function loadEnabledState() {
  chrome.storage.sync.get('extensionEnabled').then((result) => {
    AlwaysCC.extensionEnabled = result.extensionEnabled !== false;
    console.log(`Loaded enabled state: ${AlwaysCC.extensionEnabled}`);
  }).catch(error => {
    console.error("Error loading enabled state:", error);
  });
}

loadPreferredSubtitle();
loadEnabledState();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  if (changes.preferredSubtitle) {
    AlwaysCC.preferredLanguage = changes.preferredSubtitle.newValue;
    console.log(`Updated preference: ${AlwaysCC.preferredLanguage}`);

    // Re-apply both to the current video with the new language.
    AlwaysCC.captionsEnabledForCurrentVideo = false;
    AlwaysCC.audioTrackSetForCurrentVideo = false;
    setTimeout(applyPreferences, 500);
  }

  if (changes.extensionEnabled) {
    AlwaysCC.extensionEnabled = changes.extensionEnabled.newValue !== false;
    console.log(`Updated enabled state: ${AlwaysCC.extensionEnabled}`);

    if (AlwaysCC.extensionEnabled) {
      AlwaysCC.captionsEnabledForCurrentVideo = false;
      setTimeout(applyPreferences, 500);
    }
  }
});
