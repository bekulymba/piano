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

// Keyboard mapping
const KEY_TO_NOTE = {
  'q': 'C3', '2': 'C#3', 'w': 'D3', '3': 'D#3', 'e': 'E3',
  'r': 'F3', '5': 'F#3', 't': 'G3', '6': 'G#3', 'y': 'A3',
  '7': 'A#3', 'u': 'B3', 'i': 'C4', '9': 'C#4', 'o': 'D4',
  '0': 'D#4', 'p': 'E4', 'z': 'F4', 's': 'F#4', 'x': 'G4',
  'd': 'G#4', 'c': 'A4', 'f': 'A#4', 'v': 'B4', 'b': 'C5',
  'h': 'C#5', 'n': 'D5', 'j': 'D#5', 'm': 'E5'
};

const NOTE_TO_MIDI = {
  'C3': 48, 'C#3': 49, 'D3': 50, 'D#3': 51, 'E3': 52, 'F3': 53, 'F#3': 54,
  'G3': 55, 'G#3': 56, 'A3': 57, 'A#3': 58, 'B3': 59,
  'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63, 'E4': 64, 'F4': 65, 'F#4': 66,
  'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71,
  'C5': 72, 'C#5': 73, 'D5': 74, 'D#5': 75, 'E5': 76
};

// State
const activeKeys = new Set();
let currentMode = 'interactive';

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
    
    // БАГ FIX #2: Если нажал Cancel - не начинаем запись
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
    recordBtn.textContent = '● Record';
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
  player.play();
});

pauseBtn.addEventListener('click', () => {
  player.pause();
});

stopBtn.addEventListener('click', () => {
  player.stop();
  if (progressBar) progressBar.style.width = '0%';
  if (upcomingNotes) upcomingNotes.innerHTML = '';
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
    }
  } catch {
    // Ignore
  }
});

function saveSongToStorage(track) {
  try {
    const savedListRaw = localStorage.getItem('piano_songs') || '[]';
    const savedList = JSON.parse(savedListRaw);
    savedList.push(track);
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
  
  key.addEventListener('mouseup', () => {
    endNote(note);
  });
  
  key.addEventListener('mouseleave', () => {
    if (activeKeys.has(note)) {
      endNote(note);
    }
  });
});

// Keyboard events
const pressedKeys = new Set();

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  if (pressedKeys.has(key)) return;
  
  const note = KEY_TO_NOTE[key];
  if (note) {
    e.preventDefault();
    pressedKeys.add(key);
    startNote(note);
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  pressedKeys.delete(key);
  
  const note = KEY_TO_NOTE[key];
  if (note) {
    e.preventDefault();
    endNote(note);
  }
});

// Stop all notes on blur
window.addEventListener('blur', () => {
  activeKeys.forEach(note => endNote(note));
  pressedKeys.clear();
});

// Initialize
refreshSavedSelect();