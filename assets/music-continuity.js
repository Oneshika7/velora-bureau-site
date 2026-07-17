(() => {
  const audio = document.querySelector('#velora-background-audio');
  if (!audio) return;

  const stateKey = 'velora-music-state';
  const timeKey = 'velora-music-time';
  const galleryPage = document.body.classList.contains('gallery-page');
  let leaving = false;

  const read = (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const write = (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  };

  const restoreTime = Number(read(timeKey));
  const restorePlaybackPosition = () => {
    if (Number.isFinite(restoreTime) && restoreTime > 0) {
      audio.currentTime = restoreTime;
    }
  };

  if (audio.readyState >= 1) {
    restorePlaybackPosition();
  } else {
    audio.addEventListener('loadedmetadata', restorePlaybackPosition, { once: true });
  }

  const persist = (state) => {
    write(stateKey, state);
    write(timeKey, String(audio.currentTime || 0));
  };

  window.addEventListener('pagehide', () => {
    leaving = true;
    persist(audio.paused ? 'paused' : 'playing');
  });

  audio.addEventListener('play', () => persist('playing'));
  audio.addEventListener('pause', () => {
    if (!leaving) persist('paused');
  });

  if (!galleryPage) return;

  const toggle = document.querySelector('#music-toggle');
  const updateToggle = (isPlaying) => {
    if (!toggle) return;
    toggle.classList.toggle('is-playing', isPlaying);
    const label = isPlaying ? 'Pause background music' : 'Play background music';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
  };

  audio.volume = 0.35;
  audio.addEventListener('play', () => updateToggle(true));
  audio.addEventListener('pause', () => updateToggle(false));

  const playMusic = () => audio.play().then(() => {
    updateToggle(true);
    return true;
  }).catch(() => {
    updateToggle(false);
    return false;
  });

  if (read(stateKey) !== 'paused') {
    playMusic();
  }

  const beginAfterInteraction = () => {
    if (!audio.paused) return;
    playMusic().then((started) => {
      if (started) {
        document.removeEventListener('pointerdown', beginAfterInteraction, true);
        document.removeEventListener('keydown', beginAfterInteraction, true);
      }
    });
  };

  document.addEventListener('pointerdown', beginAfterInteraction, true);
  document.addEventListener('keydown', beginAfterInteraction, true);

  toggle?.addEventListener('click', () => {
    if (audio.paused) {
      playMusic();
    } else {
      audio.pause();
    }
  });
})();
