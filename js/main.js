import { audioCtx, playNote, stopNote } from './audio.js';

(function () {
  const piano = document.querySelector('.piano-wrap');
  const keyElements = Array.from(document.querySelectorAll('.key'));

  // Соответствие клавиш клавиатуры и нот
  const CODE_TO_NOTE = {
    KeyQ: 'C3',
    Digit2: 'C#3',
    KeyW: 'D3',
    Digit3: 'D#3',
    KeyE: 'E3',
    KeyR: 'F3',
    Digit5: 'F#3',
    KeyT: 'G3',
    Digit6: 'G#3',
    KeyY: 'A3',
    Digit7: 'A#3',
    KeyU: 'B3',
    KeyI: 'C4',
    Digit9: 'C#4',
    KeyO: 'D4',
    Digit0: 'D#4',
    KeyP: 'E4',
    KeyZ: 'F4',
    KeyS: 'F#4',
    KeyX: 'G4',
    KeyD: 'G#4',
    KeyC: 'A4',
    KeyF: 'A#4',
    KeyV: 'B4',
    KeyB: 'C5',
    KeyH: 'C#5',
    KeyN: 'D5',
    KeyJ: 'D#5',
    KeyM: 'E5'
  };

  // соответствие имени ноты MIDI-номеру (для Audio API)
  const NOTE_TO_NUMBER = {
    'C3': 40, 'C#3': 41, 'D3': 42, 'D#3': 43, 'E3': 44, 'F3': 45, 'F#3': 46,
    'G3': 47, 'G#3': 48, 'A3': 49, 'A#3': 50, 'B3': 51,
    'C4': 52, 'C#4': 53, 'D4': 54, 'D#4': 55, 'E4': 56, 'F4': 57, 'F#4': 58,
    'G4': 59, 'G#4': 60, 'A4': 61, 'A#4': 62, 'B4': 63,
    'C5': 64, 'C#5': 65, 'D5': 66, 'D#5': 67, 'E5': 68
  };

  // Подсветка клавиши
  function setActive(note) {
    const el = document.querySelector(`.key[data-note="${note}"]`);
    if (el) el.classList.add('active');
  }

  // Снятие подсветки
  function clearActive(note) {
    const el = document.querySelector(`.key[data-note="${note}"]`);
    if (el) el.classList.remove('active');
  }

  // Активация AudioContext при первом взаимодействии (иначе Chrome блокирует)
  window.addEventListener('click', async () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  }, { once: true });

  /* 🎹 Управление мышью / тачем */
  piano.addEventListener('pointerdown', ev => {
    const key = ev.target.closest('.key');
    if (!key) return;

    const note = key.dataset.note;
    const number = NOTE_TO_NUMBER[note];
    if (!number) return;

    key.classList.add('active');
    playNote(number);

    key.setPointerCapture(ev.pointerId);
  });

  piano.addEventListener('pointerup', ev => {
    const key = ev.target.closest('.key');
    if (!key) return;

    const note = key.dataset.note;
    const number = NOTE_TO_NUMBER[note];
    if (!number) return;

    key.classList.remove('active');
    stopNote(number);
  });

  piano.addEventListener('pointerleave', () => {
    keyElements.forEach(k => {
      k.classList.remove('active');
      const number = NOTE_TO_NUMBER[k.dataset.note];
      if (number) stopNote(number);
    });
  });

  piano.addEventListener('pointercancel', ev => {
    const key = ev.target.closest('.key');
    if (key) {
      key.classList.remove('active');
      const number = NOTE_TO_NUMBER[key.dataset.note];
      if (number) stopNote(number);
    }
  });

  /* 🎧 Управление с клавиатуры */
  document.addEventListener('keydown', ev => {
    if (ev.repeat) return;
    const note = CODE_TO_NOTE[ev.code];
    if (!note) return;

    const number = NOTE_TO_NUMBER[note];
    if (!number) return;

    setActive(note);
    playNote(number);
  });

  document.addEventListener('keyup', ev => {
    const note = CODE_TO_NOTE[ev.code];
    if (!note) return;

    const number = NOTE_TO_NUMBER[note];
    if (!number) return;

    clearActive(note);
    stopNote(number);
  });
})();