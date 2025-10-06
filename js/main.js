(function () {
  const piano = document.querySelector('.piano-wrap');
  const keyElements = Array.from(document.querySelectorAll('.key'));

  // Физические клавиши (event.code) -> ноты
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

  function setActive(note) {
    const el = document.querySelector(`.key[data-note="${note}"]`);
    if (el) el.classList.add('active');
  }

  function clearActive(note) {
    const el = document.querySelector(`.key[data-note="${note}"]`);
    if (el) el.classList.remove('active');
  }

  /* Мышь/тач */
  piano.addEventListener('pointerdown', ev => {
    const key = ev.target.closest('.key');
    if (!key) return;
    key.classList.add('active');
  });

  piano.addEventListener('pointerup', ev => {
    const key = ev.target.closest('.key');
    if (!key) return;
    key.classList.remove('active');
  });

  piano.addEventListener('pointerleave', () => {
    keyElements.forEach(k => k.classList.remove('active'));
  });

  /* Клавиатура (независимо от языка) */
  document.addEventListener('keydown', ev => {
    if (ev.repeat) return;
    const note = CODE_TO_NOTE[ev.code];
    if (!note) return;
    setActive(note);
  });

  document.addEventListener('keyup', ev => {
    const note = CODE_TO_NOTE[ev.code];
    if (!note) return;
    clearActive(note);
  });

  document.addEventListener('pointercancel', ev => {
    const key = ev.target.closest('.key');
    if (key) key.classList.remove('active');
  });
})();
