const AudioContext = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContext();

const activeNotes = new Map();
const pendingCleanups = new Map();

const ADSR = {
  attack: 0.01,
  decay: 0.08,
  sustain: 0.6,
  release: 0.15
};

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function cleanupNote(midiNumber) {
  const note = activeNotes.get(midiNumber);
  if (!note) return;

  try {
    const { osc, gain, filter } = note;
    if (osc) {
      osc.stop();
      osc.disconnect();
    }
    if (gain) gain.disconnect();
    if (filter) filter.disconnect();
  } catch {
    // Ignore cleanup errors
  }
  
  activeNotes.delete(midiNumber);
}

function cancelPendingCleanup(midiNumber) {
  const timeoutId = pendingCleanups.get(midiNumber);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingCleanups.delete(midiNumber);
  }
}

export function playNote(midiNumber) {
  if (!audioCtx) return;

  // БАГ FIX #4: Отменяем отложенную очистку если нота играется снова
  cancelPendingCleanup(midiNumber);

  const now = audioCtx.currentTime;
  const freq = midiToFreq(midiNumber);

  // Если нота уже играет, не создаем новую
  const existingNote = activeNotes.get(midiNumber);
  if (existingNote) {
    // Просто обновляем envelope для повторного нажатия
    try {
      const { gain } = existingNote;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.8, now + ADSR.attack);
      gain.gain.linearRampToValueAtTime(ADSR.sustain, now + ADSR.attack + ADSR.decay);
      
      // Обновляем время начала
      existingNote.startTime = now;
    } catch {
      // Если не получилось обновить, пересоздаем ноту
      cleanupNote(midiNumber);
    }
  }

  // Создаем новую ноту только если старой нет или очистка произошла
  if (!activeNotes.has(midiNumber)) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      // ADSR envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.8, now + ADSR.attack);
      gain.gain.linearRampToValueAtTime(ADSR.sustain, now + ADSR.attack + ADSR.decay);

      osc.frequency.setValueAtTime(freq, now);
      osc.start(now);

      // Сохраняем ноту
      activeNotes.set(midiNumber, { osc, gain, filter, startTime: now });
    } catch {
      // Если произошла ошибка при создании, очищаем
      cleanupNote(midiNumber);
    }
  }
}

export function stopNote(midiNumber) {
  const note = activeNotes.get(midiNumber);
  if (!note) return;

  // Отменяем любую отложенную очистку
  cancelPendingCleanup(midiNumber);

  const now = audioCtx.currentTime;
  const { osc, gain } = note;

  try {
    // Плавное затухание
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + ADSR.release);

    // Остановка осциллятора после затухания
    const stopTime = now + ADSR.release + 0.05;
    osc.stop(stopTime);

    // Очистка после остановки (с небольшим запасом)
    const cleanupTimeout = setTimeout(() => {
      cleanupNote(midiNumber);
      pendingCleanups.delete(midiNumber);
    }, (ADSR.release + 0.1) * 1000);
    
    pendingCleanups.set(midiNumber, cleanupTimeout);

  } catch {
    // Если что-то пошло не так, сразу очищаем
    cleanupNote(midiNumber);
  }
}

// Функция для аварийной остановки всех нот (если нужно)
export function stopAllNotes() {
  for (const [midiNumber] of activeNotes.entries()) {
    stopNote(midiNumber);
  }
}