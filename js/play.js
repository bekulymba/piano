export function createPlayer(options) {
  const {
    playFn,
    stopFn,
    onNoteOn = () => {},
    onNoteOff = () => {},
    onProgress = () => {},
    onUpcoming = () => {}
  } = options;

  let song = null;
  let speed = 1.0;
  let timers = [];
  let startTime = 0;
  let pausedAt = 0;
  let isPlayingFlag = false;
  let progressInterval = null;
  let upcomingInterval = null;
  let activeNotes = new Set(); // Отслеживание активных нот

  function clearAllTimers() {
    timers.forEach(id => clearTimeout(id));
    timers = [];
  }

  function clearIntervals() {
    if (progressInterval != null) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    if (upcomingInterval != null) {
      clearInterval(upcomingInterval);
      upcomingInterval = null;
    }
  }

  function stopAllActiveNotes() {
    // Останавливаем все активные ноты
    activeNotes.forEach(key => {
      try {
        stopFn(key);
        onNoteOff(key);
      } catch {
        // Ignore
      }
    });
    activeNotes.clear();
  }

  function loadSong(obj) {
    song = obj;
  }

  function getUpcomingNotes(currentTime, lookAheadMs = 2000) {
    if (!song || !song.notes) return [];
    
    const upcoming = [];
    const endTime = currentTime + lookAheadMs;
    
    for (const note of song.notes) {
      if (note.startTime >= currentTime && note.startTime <= endTime) {
        upcoming.push(note.key);
      }
    }
    
    return [...new Set(upcoming)].slice(0, 5);
  }

  function scheduleFrom(offsetMs = 0) {
    if (!song) return;
    const base = performance.now();
    startTime = base - offsetMs;
    const notes = song.notes || [];
    
    for (const n of notes) {
      const noteStart = (n.startTime / speed) - offsetMs;
      const noteStop = (n.startTime + n.duration) / speed - offsetMs;
      
      if (noteStop < 0) {
        continue;
      }
      
      if (noteStart >= 0) {
        const idOn = setTimeout(() => {
          playFn(n.key);
          onNoteOn(n.key);
          activeNotes.add(n.key);
        }, Math.max(0, Math.round(noteStart)));
        timers.push(idOn);
      } else {
        playFn(n.key);
        onNoteOn(n.key);
        activeNotes.add(n.key);
      }
      
      if (n.duration > 0) {
        const stopDelay = Math.max(0, Math.round(noteStop));
        const idOff = setTimeout(() => {
          stopFn(n.key);
          onNoteOff(n.key);
          activeNotes.delete(n.key);
        }, stopDelay);
        timers.push(idOff);
      }
    }

    // Progress and upcoming notes updater
    progressInterval = setInterval(() => {
      if (!song) return;
      const elapsed = performance.now() - startTime;
      const prog = Math.min(1, Math.max(0, elapsed / (song.duration / speed)));
      onProgress(prog);
      
      // Update upcoming notes
      const upcoming = getUpcomingNotes(elapsed, 2000);
      onUpcoming(upcoming);
      
      if (prog >= 1) {
        stop();
      }
    }, 100);
  }

  function play() {
    if (!song) return;
    if (isPlayingFlag) return;
    isPlayingFlag = true;
    const offset = pausedAt || 0;
    scheduleFrom(offset);
    pausedAt = 0;
  }

  function pause() {
    if (!isPlayingFlag) return;
    const elapsed = performance.now() - startTime;
    pausedAt = elapsed;
    clearAllTimers();
    clearIntervals();
    stopAllActiveNotes(); // Останавливаем все звучащие ноты
    isPlayingFlag = false;
  }

  function resume() {
    if (isPlayingFlag) return;
    isPlayingFlag = true;
    scheduleFrom(pausedAt);
    pausedAt = 0;
  }

  function stop() {
    clearAllTimers();
    clearIntervals();
    stopAllActiveNotes(); // Останавливаем все звучащие ноты
    
    pausedAt = 0;
    isPlayingFlag = false;
    onProgress(0);
    onUpcoming([]);
  }

  function setSpeed(v) {
    if (typeof v !== 'number' || v <= 0) return;
    
    let elapsed = 0;
    if (isPlayingFlag) {
      elapsed = performance.now() - startTime;
    } else {
      elapsed = pausedAt;
    }
    
    const progressFraction = song && song.duration ? 
      Math.min(1, elapsed / (song.duration / speed)) : 0;
    speed = v;
    const newElapsed = song && song.duration ? 
      progressFraction * (song.duration / speed) : elapsed;
    
    if (isPlayingFlag) {
      stop();
      pausedAt = newElapsed;
      play();
    } else {
      pausedAt = newElapsed;
    }
  }

  function isPlaying() {
    return isPlayingFlag;
  }

  return {
    loadSong,
    play,
    pause,
    resume,
    stop,
    setSpeed,
    isPlaying
  };
}