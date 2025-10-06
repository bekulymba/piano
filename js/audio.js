const AudioContext = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContext();

const activeNotes = new Map();

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
    osc.stop();
    osc.disconnect();
    gain.disconnect();
    filter.disconnect();
  } catch (e) {
    // Игнорируем ошибки при очистке
  }
  
  activeNotes.delete(midiNumber);
}

export function playNote(midiNumber) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const freq = midiToFreq(midiNumber);

  // Полностью останавливаем предыдущую ноту
  cleanupNote(midiNumber);

  // Создаём новые узлы
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
}

export function stopNote(midiNumber) {
  const note = activeNotes.get(midiNumber);
  if (!note) return;

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

    // Очистка после остановки
    setTimeout(() => {
      cleanupNote(midiNumber);
    }, (ADSR.release + 0.1) * 1000);

  } catch (e) {
    // Если что-то пошло не так, сразу очищаем
    cleanupNote(midiNumber);
  }
}