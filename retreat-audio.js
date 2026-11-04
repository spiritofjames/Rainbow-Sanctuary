// Progressive enhancement: the native audio controls remain usable if this module fails.
export function formatAudioTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function mountRetreatAudio(player) {
  const audio = player.querySelector("audio");
  const controls = player.querySelector("[data-player-controls]");
  const play = player.querySelector("[data-audio-play]");
  const playLabel = player.querySelector("[data-audio-play-label]");
  const playIcon = player.querySelector("[data-play-icon]");
  const pauseIcon = player.querySelector("[data-pause-icon]");
  const seek = player.querySelector("[data-audio-seek]");
  const elapsed = player.querySelector("[data-audio-elapsed]");
  const duration = player.querySelector("[data-audio-duration]");
  const volume = player.querySelector("[data-audio-volume]");
  const mute = player.querySelector("[data-audio-mute]");
  const volumeIcon = player.querySelector("[data-volume-icon]");
  const mutedIcon = player.querySelector("[data-muted-icon]");
  const status = player.querySelector("[data-audio-status]");
  const error = player.querySelector("[data-audio-error]");
  if (![audio, controls, play, playLabel, playIcon, pauseIcon, seek, elapsed,
    duration, volume, mute, volumeIcon, mutedIcon, status, error].every(Boolean)) return false;

  const title = player.dataset.trackTitle || "recording";
  let starting = false;
  let previewingSeek = false;
  const trackDuration = () => Number.isFinite(audio.duration) && audio.duration > 0
    ? audio.duration : Number(player.dataset.duration) || 0;
  const announce = (message) => {
    if (status.textContent !== message) status.textContent = message;
  };
  const paintRange = (input, value, maximum) => {
    input.style.setProperty("--audio-progress", `${maximum > 0 ? value / maximum * 100 : 0}%`);
  };
  const updateTime = () => {
    const total = trackDuration();
    seek.max = String(total);
    duration.textContent = formatAudioTime(total);
    seek.disabled = !Number.isFinite(audio.duration) || audio.duration <= 0;
    if (!previewingSeek) {
      seek.value = String(audio.currentTime || 0);
      elapsed.textContent = formatAudioTime(audio.currentTime);
      seek.setAttribute("aria-valuetext", `${formatAudioTime(audio.currentTime)} of ${formatAudioTime(total)}`);
      paintRange(seek, audio.currentTime || 0, total);
    }
  };
  const updatePlayback = () => {
    const playing = !audio.paused && !audio.ended;
    play.setAttribute("aria-label", `${playing ? "Pause" : audio.ended ? "Replay" : "Play"} ${title}`);
    playLabel.textContent = playing ? "Pause song" : audio.ended ? "Play again" : "Play song";
    playIcon.toggleAttribute("hidden", playing);
    pauseIcon.toggleAttribute("hidden", !playing);
    player.dataset.playing = String(playing);
  };
  const updateVolume = () => {
    const silent = audio.muted || audio.volume === 0;
    volume.value = String(silent ? 0 : audio.volume);
    volume.setAttribute("aria-valuetext", `${Math.round(Number(volume.value) * 100)} percent`);
    mute.setAttribute("aria-label", silent ? "Unmute audio" : "Mute audio");
    mute.setAttribute("aria-pressed", String(silent));
    volumeIcon.toggleAttribute("hidden", silent);
    mutedIcon.toggleAttribute("hidden", !silent);
    paintRange(volume, Number(volume.value), 1);
  };
  const showError = () => {
    error.hidden = false;
    play.removeAttribute("aria-busy");
    announce("The recording could not be played. Try again or open the recording directly.");
    updatePlayback();
  };

  play.addEventListener("click", async () => {
    if (starting) return;
    if (!audio.paused && !audio.ended) {
      audio.pause();
      return;
    }
    starting = true;
    error.hidden = true;
    play.setAttribute("aria-busy", "true");
    announce("Loading the song…");
    try {
      if (audio.error) audio.load();
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
    } catch (playError) {
      if (playError?.name !== "AbortError") showError();
    } finally {
      starting = false;
      play.removeAttribute("aria-busy");
      updatePlayback();
    }
  });
  seek.addEventListener("input", () => {
    previewingSeek = true;
    elapsed.textContent = formatAudioTime(Number(seek.value));
    seek.setAttribute("aria-valuetext", `${formatAudioTime(Number(seek.value))} of ${formatAudioTime(trackDuration())}`);
    paintRange(seek, Number(seek.value), trackDuration());
  });
  seek.addEventListener("change", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(audio.duration, Math.max(0, Number(seek.value) || 0));
    }
    previewingSeek = false;
    updateTime();
  });
  volume.addEventListener("input", () => {
    audio.volume = Math.min(1, Math.max(0, Number(volume.value) || 0));
    audio.muted = audio.volume === 0;
    updateVolume();
  });
  mute.addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
      if (audio.volume === 0) audio.volume = 0.75;
      audio.muted = false;
    } else audio.muted = true;
    updateVolume();
  });
  for (const event of ["loadedmetadata", "durationchange", "timeupdate", "seeked"]) {
    audio.addEventListener(event, updateTime);
  }
  audio.addEventListener("playing", () => {
    error.hidden = true;
    announce("Playing");
    updatePlayback();
  });
  audio.addEventListener("pause", () => { announce("Paused"); updatePlayback(); });
  audio.addEventListener("ended", () => {
    announce("The song has ended. Take a quiet moment for yourself.");
    updatePlayback();
    updateTime();
  });
  audio.addEventListener("waiting", () => { if (!audio.paused) announce("Buffering…"); });
  audio.addEventListener("volumechange", updateVolume);
  audio.addEventListener("error", showError);

  seek.value = "0";
  error.hidden = true;
  updateTime();
  updatePlayback();
  updateVolume();
  audio.controls = false;
  audio.hidden = true;
  controls.hidden = false;
  player.dataset.audioReady = "true";
  return true;
}

if (typeof document !== "undefined") {
  const mounted = new WeakSet();
  const mountPlayers = () => {
    for (const player of document.querySelectorAll("[data-retreat-audio]")) {
      // The Design Canvas runtime replaces the x-dc source with a rendered tree.
      if (player.closest("x-dc") || mounted.has(player)) continue;
      if (mountRetreatAudio(player)) mounted.add(player);
    }
  };
  const start = () => {
    mountPlayers();
    new MutationObserver(mountPlayers).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}
