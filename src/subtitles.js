/**
 * AlwaysCC – preferred subtitle selection.
 *
 * pickSubtitle() assumes the settings menu is already open at its root panel
 * (apply.js owns opening/closing). Selecting any subtitle entry also turns CC
 * on, so there is no separate "enable captions" step / 'c' key press.
 *
 * Flow (preferredLanguage = "Thai"):
 *   0. if the Subtitles/CC row already shows "Thai" -> nothing to do
 *   1. open Subtitles/CC
 *   2a. "Thai" listed directly            -> select it (unless already checked)
 *   2b. otherwise:
 *       - select the "(auto-generated)" track first (Auto-translate is inert
 *         while CC is Off / has no active source track)
 *       - re-open Subtitles/CC -> Auto-translate -> "Thai"
 *
 * Matching is done against each item's `.ytp-menuitem-label` and scoped to the
 * visible panel, so the root "Subtitles/CC" row (whose text also contains the
 * current language) is never mistaken for a language option.
 */

// Iterates items, calling predicate(item, labelText). Returns the first match.
function findMenuItem(items, predicate) {
  for (const item of items) {
    const labelEl = item.querySelector('.ytp-menuitem-label');
    const label = (labelEl || item).textContent.trim();
    if (predicate(item, label)) return item;
  }
  return null;
}

// True if the root Subtitles/CC row already reports the preferred language as
// the active caption (e.g. "Thai" or "Spanish (auto-generated) >> Thai").
function subtitleAlreadySet(lang) {
  for (const item of document.querySelectorAll('.ytp-menuitem')) {
    if (item.offsetParent === null) continue;
    const label = (item.querySelector('.ytp-menuitem-label') || item).textContent.trim();
    if (!label.includes('Subtitles/CC') && !label.includes('Caption')) continue;

    const content = item.querySelector('.ytp-menuitem-content');
    const value = content ? content.textContent.trim() : '';
    if (value.includes(lang)) {
      console.log(`Subtitle already set: ${value}`);
      return true;
    }
    return false; // found the row; value doesn't match
  }
  return false;
}

// Ensures the settings menu is at root, opens the Subtitles/CC panel, then
// calls cb(panelElement) — or cb(null) if it couldn't be opened.
function openSubtitlesPanel(settingsButton, cb) {
  ensureSettingsRoot(settingsButton, () => {
    const row = findMenuItem(
      document.querySelectorAll('.ytp-panel-menu .ytp-menuitem'),
      (item, label) => item.offsetParent !== null &&
        (label.includes('Subtitles/CC') || label.includes('Caption'))
    );
    if (!row) {
      console.log("Subtitles/CC row not found");
      return cb(null);
    }
    activateMenuItem(row);
    console.log("Opened Subtitles/CC panel");
    setTimeout(() => {
      const panel = settingsPanelByTitle(/subtitle|caption/i);
      if (!panel) {
        console.log("Subtitles panel didn't open");
        return cb(null);
      }
      cb(panel);
    }, 300);
  });
}

function pickSubtitle(settingsButton, done) {
  const lang = AlwaysCC.preferredLanguage;
  console.log(`Selecting subtitle: ${lang}`);

  if (subtitleAlreadySet(lang)) return done();

  // Second visit: source track active, now Auto-translate -> lang.
  const doAutoTranslate = () => {
    openSubtitlesPanel(settingsButton, (panel) => {
      if (!panel) return done();

      const autoTranslate = findMenuItem(
        panel.querySelectorAll('.ytp-menuitem'),
        (_, label) => label.includes('Auto-translate')
      );
      if (!autoTranslate) {
        console.log("Auto-translate option not found");
        return done();
      }

      activateMenuItem(autoTranslate);
      console.log("Opened Auto-translate list");
      setTimeout(() => {
        const tpanel = settingsPanelByTitle(/translate/i)
          || settingsPanelByTitle(/subtitle|caption/i);
        const items = (tpanel || document)
          .querySelectorAll('.ytp-menuitem[role="menuitemradio"]');

        const target = findMenuItem(items, (_, label) => label.includes(lang));
        if (!target) {
          console.log(`${lang} not found in auto-translate list`);
          return done();
        }
        if (target.getAttribute('aria-checked') === 'true') {
          console.log(`Auto-translate already ${lang}`);
          return done();
        }
        activateMenuItem(target);
        console.log(`Selected ${lang} via auto-translate`);
        setTimeout(done, 300);
      }, 300);
    });
  };

  openSubtitlesPanel(settingsButton, (panel) => {
    if (!panel) return done();

    const radios = panel.querySelectorAll('.ytp-menuitem[role="menuitemradio"]');

    // 2a. a direct caption track in the preferred language.
    const direct = findMenuItem(radios, (_, label) =>
      !label.includes('Auto-translate') && label.includes(lang));
    if (direct) {
      if (direct.getAttribute('aria-checked') === 'true') {
        console.log(`Caption track already ${lang}`);
        return done();
      }
      activateMenuItem(direct);
      console.log(`Selected caption track: ${direct.textContent.trim()}`);
      return setTimeout(done, 300);
    }

    // 2b. activate the auto-generated source track, then auto-translate.
    const autoGen = findMenuItem(radios, (_, label) =>
      label.toLowerCase().includes('auto-generated'));

    if (autoGen && autoGen.getAttribute('aria-checked') !== 'true') {
      activateMenuItem(autoGen);
      console.log(`Selected source track: ${autoGen.textContent.trim()}`);
      setTimeout(doAutoTranslate, 600); // let the track apply
    } else if (autoGen ||
               findMenuItem(panel.querySelectorAll('.ytp-menuitem'),
                            (_, l) => l.includes('Auto-translate'))) {
      // source already active (or no explicit auto-gen row) — go straight in.
      doAutoTranslate();
    } else {
      console.log("No auto-generated track and no Auto-translate option");
      done();
    }
  });
}
