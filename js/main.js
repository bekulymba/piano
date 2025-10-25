import { audioCtx, playNote, stopNote } from './audio.js';
import { createRecorder } from './record.js';
import { createPlayer } from './play.js';

// UI Elements
const interactiveMode = document.getElementById('interactiveMode');
const preparedMode = document.getElementById('preparedMode');
const interactiveControls = document.getElementById('interactiveControls');
const preparedControls = document.getElementById('preparedControls');
const recordBtn = document.getElementById('recordBtn');
const downloadBtn = document.getElementById('downloadBtn');
const recordingIndicator = document.getElementById('recordingIndicator');
const loadFileBtn = document.getElementById('loadFileBtn');
const fileInput = document.getElementById('fileInput');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const speedSelect = document.getElementById('speedSelect');
const savedSelect = document.getElementById('savedSelect');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const upcomingNotes = document.getElementById('upcomingNotes');
const currentTrack = document.getElementById('currentTrack');
const trackName = document.getElementById('trackName');
const expandPianoBtn = document.getElementById('expandPianoBtn');
const expandPianoBtn2 = document.getElementById('expandPianoBtn2');
const pianoWrap = document.getElementById('pianoWrap');

// Keyboard mapping using e.code (independent of keyboard layout)
const CODE_TO_NOTE = {
  'KeyQ': 'C3', 'Digit2': 'C#3', 'KeyW': 'D3', 'Digit3': 'D#3', 'KeyE': 'E3',
  'KeyR': 'F3', 'Digit5': 'F#3', 'KeyT': 'G3', 'Digit6': 'G#3', 'KeyY': 'A3',
  'Digit7': 'A#3', 'KeyU': 'B3', 'KeyI': 'C4', 'Digit9': 'C#4', 'KeyO': 'D4',
  'Digit0': 'D#4', 'KeyP': 'E4', 'KeyZ': 'F4', 'KeyS': 'F#4', 'KeyX': 'G4',
  'KeyD': 'G#4', 'KeyC': 'A4', 'KeyF': 'A#4', 'KeyV': 'B4', 'KeyB': 'C5',
  'KeyH': 'C#5', 'KeyN': 'D5', 'KeyJ': 'D#5', 'KeyM': 'E5'
};

// Extended NOTE_TO_MIDI mapping for all octaves (C1-C8)
const NOTE_TO_MIDI = {
  // Octave 1
  'C1': 24, 'C#1': 25, 'D1': 26, 'D#1': 27, 'E1': 28, 'F1': 29, 'F#1': 30,
  'G1': 31, 'G#1': 32, 'A1': 33, 'A#1': 34, 'B1': 35,
  // Octave 2
  'C2': 36, 'C#2': 37, 'D2': 38, 'D#2': 39, 'E2': 40, 'F2': 41, 'F#2': 42,
  'G2': 43, 'G#2': 44, 'A2': 45, 'A#2': 46, 'B2': 47,
  // Octave 3
  'C3': 48, 'C#3': 49, 'D3': 50, 'D#3': 51, 'E3': 52, 'F3': 53, 'F#3': 54,
  'G3': 55, 'G#3': 56, 'A3': 57, 'A#3': 58, 'B3': 59,
  // Octave 4
  'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63, 'E4': 64, 'F4': 65, 'F#4': 66,
  'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71,
  // Octave 5
  'C5': 72, 'C#5': 73, 'D5': 74, 'D#5': 75, 'E5': 76, 'F5': 77, 'F#5': 78,
  'G5': 79, 'G#5': 80, 'A5': 81, 'A#5': 82, 'B5': 83,
  // Octave 6
  'C6': 84, 'C#6': 85, 'D6': 86, 'D#6': 87, 'E6': 88, 'F6': 89, 'F#6': 90,
  'G6': 91, 'G#6': 92, 'A6': 93, 'A#6': 94, 'B6': 95,
  // Octave 7
  'C7': 96, 'C#7': 97, 'D7': 98, 'D#7': 99, 'E7': 100, 'F7': 101, 'F#7': 102,
  'G7': 103, 'G#7': 104, 'A7': 105, 'A#7': 106, 'B7': 107,
  // Octave 8
  'C8': 108
};

// State
const activeKeys = new Set();
let currentMode = 'interactive';
let currentLoadedSong = null;
let currentPlayingSong = null; // Отслеживаем воспроизводящуюся песню
let isPianoExpanded = false;

// Функция для обновления отображения текущей песни
function updateCurrentTrack(songName, isPlaying = false) {
  if (songName) {
    if (trackName) trackName.textContent = songName;
    if (currentTrack) {
      currentTrack.classList.remove('hidden');
      // Можно добавить индикатор воспроизведения
      if (isPlaying) {
        trackName.style.color = '#10b981'; // Зелёный цвет при воспроизведении
      } else {
        trackName.style.color = '#9ca3af'; // Серый при паузе
      }
    }
  } else {
    if (currentTrack) currentTrack.classList.add('hidden');
  }
}

// Piano expand/collapse functionality
function togglePianoExpansion() {
  isPianoExpanded = !isPianoExpanded;
  
  if (isPianoExpanded) {
    pianoWrap.classList.add('expanded');
    if (expandPianoBtn) expandPianoBtn.textContent = 'Collapse';
    if (expandPianoBtn2) expandPianoBtn2.textContent = 'Collapse';
  } else {
    pianoWrap.classList.remove('expanded');
    if (expandPianoBtn) expandPianoBtn.textContent = 'Expand';
    if (expandPianoBtn2) expandPianoBtn2.textContent = 'Expand';
  }
}

// Event listeners for expand buttons
if (expandPianoBtn) {
  expandPianoBtn.addEventListener('click', togglePianoExpansion);
}
if (expandPianoBtn2) {
  expandPianoBtn2.addEventListener('click', togglePianoExpansion);
}

// Create recorder and player
const recorder = createRecorder();
const player = createPlayer({
  playFn: (key) => {
    const midi = NOTE_TO_MIDI[key];
    if (midi) playNote(midi);
  },
  stopFn: (key) => {
    const midi = NOTE_TO_MIDI[key];
    if (midi) stopNote(midi);
  },
  onNoteOn: (key) => {
    const el = document.querySelector(`.key[data-note="${key}"]`);
    if (el) el.classList.add('active');
  },
  onNoteOff: (key) => {
    const el = document.querySelector(`.key[data-note="${key}"]`);
    if (el) el.classList.remove('active');
  },
  onProgress: (frac) => {
    if (progressBar) progressBar.style.width = `${Math.round(frac * 100)}%`;
  },
  onUpcoming: (notes) => {
    if (!upcomingNotes) return;
    if (notes.length === 0) {
      upcomingNotes.innerHTML = '<span style="color: #9ca3af;">No upcoming notes</span>';
    } else {
      upcomingNotes.innerHTML = notes
        .map(n => `<span class="note-preview">${n}</span>`)
        .join('');
    }
  }
});

// Mode switching
interactiveMode.addEventListener('click', () => {
  currentMode = 'interactive';
  interactiveMode.classList.add('active');
  preparedMode.classList.remove('active');
  interactiveControls.classList.remove('hidden');
  preparedControls.classList.add('hidden');
  progressContainer.classList.add('hidden');
  if (upcomingNotes) upcomingNotes.classList.add('hidden');
  player.stop();
  currentPlayingSong = null; // Сбрасываем воспроизводящуюся песню
  updateCurrentTrack(null, false);
});

preparedMode.addEventListener('click', () => {
  currentMode = 'prepared';
  preparedMode.classList.add('active');
  interactiveMode.classList.remove('active');
  preparedControls.classList.remove('hidden');
  interactiveControls.classList.add('hidden');
  progressContainer.classList.remove('hidden');
  if (upcomingNotes) upcomingNotes.classList.remove('hidden');
  if (recorder.isRecording()) {
    recorder.stop();
    recordBtn.classList.remove('active');
    recordingIndicator.classList.add('hidden');
  }
});

// Recording
recordBtn.addEventListener('click', () => {
  if (!recorder.isRecording()) {
    const name = prompt('Recording name:', 'My Song');
    
    // Если нажал Cancel - не начинаем запись
    if (name === null) {
      return;
    }
    
    recorder.start(name || 'My Song');
    recordBtn.classList.add('active');
    recordBtn.textContent = '⏹ Stop Recording';
    recordingIndicator.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
  } else {
    const track = recorder.stop();
    recordBtn.classList.remove('active');
    recordBtn.textContent = '⬤ Record';
    recordingIndicator.classList.add('hidden');
    
    const { url, filename } = recorder.exportJSON(track.name || 'recording');
    downloadBtn.href = url;
    downloadBtn.download = filename;
    downloadBtn.classList.remove('hidden');
    
    saveSongToStorage(track);
    refreshSavedSelect();
  }
});

// File loading
loadFileBtn.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      player.loadSong(obj);
      currentLoadedSong = obj;
      
      // Сохраняем загруженную песню в localStorage
      saveSongToStorage(obj);
      refreshSavedSelect();
      
      alert(`Loaded: ${obj.name || 'Unknown'}`);
    } catch {
      alert('Failed to load file');
    }
  };
  reader.readAsText(f);
  fileInput.value = '';
});

// Playback controls
playBtn.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  // Устанавливаем текущую воспроизводящуюся песню
  currentPlayingSong = currentLoadedSong;
  player.play();
  
  // Обновляем отображение текущей песни
  if (currentPlayingSong && currentPlayingSong.name) {
    updateCurrentTrack(currentPlayingSong.name, true);
  }
});

pauseBtn.addEventListener('click', () => {
  player.pause();
  // При паузе показываем название текущей воспроизводящейся песни, но без статуса "играет"
  if (currentPlayingSong && currentPlayingSong.name) {
    updateCurrentTrack(currentPlayingSong.name, false);
  } else {
    updateCurrentTrack(null, false);
  }
});

stopBtn.addEventListener('click', () => {
  player.stop();
  currentPlayingSong = null; // Сбрасываем воспроизводящуюся песню
  if (progressBar) progressBar.style.width = '0%';
  if (upcomingNotes) upcomingNotes.innerHTML = '';
  updateCurrentTrack(null, false);
});

speedSelect.addEventListener('change', (ev) => {
  const v = parseFloat(ev.target.value) || 1.0;
  player.setSpeed(v);
});

// Saved songs
savedSelect.addEventListener('change', () => {
  const idx = parseInt(savedSelect.value, 10);
  if (isNaN(idx)) return;
  const raw = localStorage.getItem('piano_songs') || '[]';
  try {
    const list = JSON.parse(raw);
    const song = list[idx];
    if (song) {
      player.loadSong(song);
      currentLoadedSong = song;
    }
  } catch {
    // Ignore
  }
});

function saveSongToStorage(track) {
  try {
    const savedListRaw = localStorage.getItem('piano_songs') || '[]';
    let savedList = JSON.parse(savedListRaw);
    
    // Проверяем, не существует ли уже песня с таким именем
    const existingIndex = savedList.findIndex(s => s.name === track.name);
    
    if (existingIndex !== -1) {
      // Если песня существует, спрашиваем пользователя
      const overwrite = confirm(`Song "${track.name}" already exists. Overwrite?`);
      if (overwrite) {
        savedList[existingIndex] = track;
      } else {
        return; // Не сохраняем
      }
    } else {
      // Добавляем новую песню
      savedList.push(track);
    }
    
    localStorage.setItem('piano_songs', JSON.stringify(savedList));
  } catch {
    // Ignore
  }
}

function refreshSavedSelect() {
  if (!savedSelect) return;
  savedSelect.innerHTML = '<option value="">-- Saved Songs --</option>';
  const raw = localStorage.getItem('piano_songs') || '[]';
  let list = [];
  try {
    list = JSON.parse(raw);
  } catch  {
    list = [];
  }
  list.forEach((song, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = `${song.name || 'Untitled'} (${Math.round((song.duration || 0) / 1000)}s)`;
    savedSelect.appendChild(opt);
  });
}

// Piano key interaction
function startNote(note) {
  if (currentMode === 'prepared') return;
  if (activeKeys.has(note)) return;
  
  activeKeys.add(note);
  const midi = NOTE_TO_MIDI[note];
  if (midi) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    playNote(midi);
    recorder.noteOn(note);
  }
  
  const el = document.querySelector(`.key[data-note="${note}"]`);
  if (el) el.classList.add('active');
}

function endNote(note) {
  if (!activeKeys.has(note)) return;
  
  activeKeys.delete(note);
  const midi = NOTE_TO_MIDI[note];
  if (midi) {
    stopNote(midi);
    recorder.noteOff(note);
  }
  
  const el = document.querySelector(`.key[data-note="${note}"]`);
  if (el) el.classList.remove('active');
}

// Mouse events
document.querySelectorAll('.key').forEach(key => {
  const note = key.dataset.note;
  
  key.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startNote(note);
  });
  
  key.addEventListener('mouseup', (e) => {
    e.preventDefault();
    endNote(note);
  });
  
  key.addEventListener('mouseleave', () => {
    if (activeKeys.has(note)) {
      endNote(note);
    }
  });
  
  // Поддержка правой кнопки мыши (ПКМ)
  key.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // Переключение: если нота активна - останавливаем, иначе - начинаем
    if (activeKeys.has(note)) {
      endNote(note);
    } else {
      startNote(note);
    }
  });
});

// Keyboard events (using e.code for layout independence)
const pressedCodes = new Set();

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const code = e.code;
  if (pressedCodes.has(code)) return;
  
  const note = CODE_TO_NOTE[code];
  if (note) {
    e.preventDefault();
    pressedCodes.add(code);
    startNote(note);
  }
});

document.addEventListener('keyup', (e) => {
  const code = e.code;
  pressedCodes.delete(code);
  
  const note = CODE_TO_NOTE[code];
  if (note) {
    e.preventDefault();
    endNote(note);
  }
});

// Stop all notes on blur
window.addEventListener('blur', () => {
  activeKeys.forEach(note => endNote(note));
  pressedCodes.clear();
});

// Initialize
refreshSavedSelect();