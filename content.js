/**
 * YouTube Auto Subtitles Extension
 * Automatically enables subtitles on YouTube videos and selects user's preferred subtitle option
 */

// Track if we've already enabled captions for the current video
let captionsEnabledForCurrentVideo = false;
let currentVideoId = '';

// Default subtitle preference: just a plain language name
let PREFERRED_LANGUAGE = "Thai";

// Whether the extension is active
let EXTENSION_ENABLED = true;

// Load user preference from storage
function loadPreferredSubtitle() {
  chrome.storage.sync.get('preferredSubtitle').then((result) => {
    if (result.preferredSubtitle) {
      PREFERRED_LANGUAGE = result.preferredSubtitle;
      console.log(`Loaded subtitle preference: ${PREFERRED_LANGUAGE}`);
    }
  }).catch(error => {
    console.error("Error loading subtitle preference:", error);
  });
}

// Load enabled state from storage
function loadEnabledState() {
  chrome.storage.sync.get('extensionEnabled').then((result) => {
    EXTENSION_ENABLED = result.extensionEnabled !== false;
    console.log(`Loaded enabled state: ${EXTENSION_ENABLED}`);
  }).catch(error => {
    console.error("Error loading enabled state:", error);
  });
}

// Load preference when script starts
loadPreferredSubtitle();
loadEnabledState();

// Listen for changes to the preference
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  if (changes.preferredSubtitle) {
    PREFERRED_LANGUAGE = changes.preferredSubtitle.newValue;
    console.log(`Updated subtitle preference: ${PREFERRED_LANGUAGE}`);

    // Reset tracking to allow re-processing current video with new preference
    captionsEnabledForCurrentVideo = false;
    // Try to apply the new setting immediately
    setTimeout(enableCaptions, 500);
  }

  if (changes.extensionEnabled) {
    EXTENSION_ENABLED = changes.extensionEnabled.newValue !== false;
    console.log(`Updated enabled state: ${EXTENSION_ENABLED}`);

    if (EXTENSION_ENABLED) {
      // Reset tracking so captions get applied on re-enable
      captionsEnabledForCurrentVideo = false;
      setTimeout(enableCaptions, 500);
    }
  }
});

// Main function to enable captions
function enableCaptions() {
  if (!EXTENSION_ENABLED) {
    return;
  }

  // Only run on video pages
  if (!window.location.pathname.includes('/watch')) {
    return;
  }

  // Extract video ID from URL to track when video changes
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  // If we've already enabled captions for this video, don't do it again
  if (videoId === currentVideoId && captionsEnabledForCurrentVideo) {
    return;
  }
  
  // Update current video tracking
  currentVideoId = videoId;
  captionsEnabledForCurrentVideo = false;

  // Find the YouTube player
  const player = document.querySelector('.html5-video-player');
  if (!player) {
    // Try again if player isn't loaded yet
    setTimeout(enableCaptions, 1000);
    return;
  }

  // Check if captions are already enabled
  const captionsButton = document.querySelector('.ytp-subtitles-button');
  if (captionsButton) {
    const captionsAlreadyEnabled = captionsButton.getAttribute('aria-pressed') === 'true';
    
    if (!captionsAlreadyEnabled) {
      // Enable captions first if they're not already on
      captionsButton.click();
      console.log("Clicked captions button to enable subtitles");
      
      // Wait a bit for the UI to update after enabling captions
      setTimeout(selectPreferredSubtitle, 500);
    } else {
      // If captions are already on, just select the preferred subtitle
      selectPreferredSubtitle();
    }
    
    captionsEnabledForCurrentVideo = true;
    return;
  }
  
  // Fallback methods if the captions button wasn't found
  
  // Method 2: Try using YouTube API if available
  if (typeof player.toggleSubtitlesOn === 'function') {
    player.toggleSubtitlesOn();
    console.log("Used player API to enable subtitles");
    setTimeout(selectPreferredSubtitle, 500);
    captionsEnabledForCurrentVideo = true;
    return;
  }

  // Method 3: Last resort - use keyboard shortcut
  const videoElement = document.querySelector('video');
  if (videoElement) {
    // Ensure video has focus
    videoElement.focus();
    
    // Create and dispatch a keyboard event for the 'c' key
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'c',
      code: 'KeyC',
      keyCode: 67,
      which: 67,
      bubbles: true,
      cancelable: true
    });
    
    videoElement.dispatchEvent(keyEvent);
    console.log("Used keyboard shortcut to enable subtitles");
    setTimeout(selectPreferredSubtitle, 500);
    captionsEnabledForCurrentVideo = true;
  }
}

// Closes the settings panel if it's still open. Checks the button's own
// aria-expanded state rather than looking for .ytp-settings-menu in the DOM,
// since that element can remain present-but-hidden after YouTube closes the
// panel on its own — relying on it caused the button.click() here to
// re-toggle (and re-open) an already-closed menu.
function closeSettingsMenu(settingsButton) {
  if (settingsButton.getAttribute('aria-expanded') === 'true') {
    settingsButton.click();
    console.log("Settings menu still open (aria-expanded=true), closing it");
  }
}

// Opens Settings -> Subtitles/CC and hands back the submenu's option elements.
// Calls onReady(null) if either menu couldn't be found.
function openSubtitlesSubmenu(settingsButton, onReady) {
  settingsButton.click();
  console.log("Clicked settings button");

  setTimeout(() => {
    const menuItems = document.querySelectorAll('.ytp-menuitem');
    let subtitlesMenuItem = null;

    for (const item of menuItems) {
      const text = item.textContent.trim();
      if (text.includes('Subtitles/CC') || text.includes('Caption')) {
        subtitlesMenuItem = item;
        break;
      }
    }

    if (!subtitlesMenuItem) {
      console.log("Subtitles menu item not found, closing menu");
      closeSettingsMenu(settingsButton);
      onReady(null);
      return;
    }

    subtitlesMenuItem.click();
    console.log("Clicked subtitles menu item");

    setTimeout(() => {
      onReady(document.querySelectorAll('.ytp-menuitem'));
    }, 300);
  }, 300);
}

// Fallback: open the Auto-translate submenu and pick the preferred language.
function tryAutoTranslate(settingsButton, subtitleOptions) {
  let autoTranslateOption = null;
  for (const option of subtitleOptions) {
    if (option.textContent.trim().includes('Auto-translate')) {
      autoTranslateOption = option;
      break;
    }
  }

  if (!autoTranslateOption) {
    console.log("Auto-translate option not found, closing menu");
    closeSettingsMenu(settingsButton);
    return;
  }

  autoTranslateOption.click();
  console.log("Clicked auto-translate option");

  setTimeout(() => {
    const languageOptions = document.querySelectorAll('.ytp-menuitem');
    let targetLanguageOption = null;

    for (const option of languageOptions) {
      if (option.textContent.trim().includes(PREFERRED_LANGUAGE)) {
        targetLanguageOption = option;
        break;
      }
    }

    if (targetLanguageOption) {
      targetLanguageOption.click();
      console.log(`Selected ${PREFERRED_LANGUAGE} from auto-translate menu`);
      // Give YouTube a moment to close the panel on its own, then verify.
      setTimeout(() => closeSettingsMenu(settingsButton), 300);
    } else {
      console.log(`${PREFERRED_LANGUAGE} not found in auto-translate menu, closing menu`);
      closeSettingsMenu(settingsButton);
    }
  }, 300);
}

// Function to select the preferred subtitle language.
// Tries an auto-generated (or manual) caption track in PREFERRED_LANGUAGE
// first, then falls back to auto-translating to that language.
function selectPreferredSubtitle() {
  console.log(`Attempting to select preferred subtitle: ${PREFERRED_LANGUAGE}`);

  const settingsButton = document.querySelector('.ytp-settings-button');
  if (!settingsButton) {
    console.log("Settings button not found");
    return;
  }

  openSubtitlesSubmenu(settingsButton, (subtitleOptions) => {
    if (!subtitleOptions) return;

    // Step 1: look for a direct (auto-generated or manual) caption track
    let match = null;
    for (const option of subtitleOptions) {
      const text = option.textContent.trim();
      if (!text.includes('Auto-translate') && text.includes(PREFERRED_LANGUAGE)) {
        match = option;
        break;
      }
    }

    if (match) {
      match.click();
      console.log(`Selected auto-generated/manual caption: ${match.textContent.trim()}`);
      // Give YouTube a moment to close the panel on its own, then verify.
      setTimeout(() => closeSettingsMenu(settingsButton), 300);
      return;
    }

    // Step 2: fall back to auto-translate
    console.log(`No direct caption track for ${PREFERRED_LANGUAGE}, falling back to auto-translate`);
    tryAutoTranslate(settingsButton, subtitleOptions);
  });
}

// Initial run when page loads
setTimeout(() => {
  enableCaptions();
}, 2000); // Wait for player to be fully initialized

// Re-run when navigation happens within YouTube (for SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    captionsEnabledForCurrentVideo = false; // Reset state when URL changes
    setTimeout(enableCaptions, 2000); // Wait for video player to load after navigation
  }
}).observe(document, { subtree: true, childList: true });

// One additional check in case the player loads late
setTimeout(enableCaptions, 5000); 