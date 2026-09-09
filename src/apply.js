/**
 * AlwaysCC – orchestrator.
 *
 * Applies both preferences within a SINGLE settings-menu session: one open of
 * .ytp-settings-button, then subtitle selection, then (back to root) audio-track
 * selection, then close.
 *
 * Order matters: subtitles first, audio last — switching the audio track makes
 * YouTube reload the player and tear the menu down, so it has to be the final
 * step. That reload can also drop captions, so when the track actually changes
 * we clear the caption flag and re-run.
 */
function applyPreferences() {
  if (!window.location.pathname.includes('/watch')) return;

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (videoId !== AlwaysCC.currentVideoId) {
    AlwaysCC.currentVideoId = videoId;
    AlwaysCC.captionsEnabledForCurrentVideo = false;
    AlwaysCC.audioTrackSetForCurrentVideo = false;
  }

  const doSubs = AlwaysCC.extensionEnabled && !AlwaysCC.captionsEnabledForCurrentVideo;
  const doAudio = !AlwaysCC.audioTrackSetForCurrentVideo;
  if (!doSubs && !doAudio) return;

  if (AlwaysCC.settingsMenuBusy) {
    setTimeout(applyPreferences, 800);
    return;
  }

  const player = document.querySelector('.html5-video-player');
  const settingsButton = document.querySelector('.ytp-settings-button');
  if (!player || !settingsButton) {
    setTimeout(applyPreferences, 1000); // not ready yet
    return;
  }

  AlwaysCC.settingsMenuBusy = true;

  // Pause while we navigate the menu; resume afterwards only if it was playing.
  const video = document.querySelector('video');
  const resumeWhenDone = !!video && !video.paused;
  if (resumeWhenDone) {
    setVideoPaused(true);
    console.log("Paused video for menu work");
  }

  const watchdog = setTimeout(() => { AlwaysCC.settingsMenuBusy = false; }, 15000);
  const finish = () => {
    clearTimeout(watchdog);
    // closeSettingsMenu() also clears settingsMenuBusy.
    setTimeout(() => {
      closeSettingsMenu(settingsButton);
      if (resumeWhenDone) {
        setVideoPaused(false);
        console.log("Resumed video");
      }
    }, 300);
  };

  const stepAudio = () => {
    if (!doAudio) return finish();
    ensureSettingsRoot(settingsButton, () => {
      pickAudioTrack(settingsButton, (changed) => {
        AlwaysCC.audioTrackSetForCurrentVideo = true;
        if (changed) {
          // Switching the track reloads the player. Captions usually survive —
          // check the CC button without opening the menu (no pause/resume), and
          // only re-run if they actually dropped.
          setTimeout(() => {
            const cc = document.querySelector('.ytp-subtitles-button');
            if (cc && cc.getAttribute('aria-pressed') === 'true') return;
            console.log("Captions dropped after audio reload, re-applying");
            AlwaysCC.captionsEnabledForCurrentVideo = false;
            applyPreferences();
          }, 3000);
        }
        finish();
      });
    });
  };

  const stepSubs = () => {
    if (!doSubs) return stepAudio();
    // pickSubtitle() navigates from the settings root itself.
    pickSubtitle(settingsButton, () => {
      AlwaysCC.captionsEnabledForCurrentVideo = true;
      stepAudio();
    });
  };

  openSettingsMenu(settingsButton, stepSubs);
}
