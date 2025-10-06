const AudioContext = window.AudioContext || window.webkitAudioContext;
export const audioCtx = new AudioContext();

const activeNotes = new Map();

const ADSR = {
  attack: 0.02,
  decay: 0.1,
  sustain: 0.7,
  release: 0.25
};

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function playNote(midiNumber) {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const freq = midiToFreq(midiNumber);

  // Останавливаем предыдущую, если она существует
  const prev = activeNotes.get(midiNumber);
  if (prev) {
    try {
      const { osc, gain } = prev;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.stop(now + 0.05);
      osc.disconnect();
      gain.disconnect();
    } catch (_) {}
    activeNotes.delete(midiNumber);
  }

  // Создаём новый осциллятор
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'triangle';
  filter.type = 'lowpass';
  filter.frequency.value = 1800;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  // ADSR — плавное нарастание и спад
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1.0, now + ADSR.attack);
  gain.gain.linearRampToValueAtTime(ADSR.sustain, now + ADSR.attack + ADSR.decay);

  osc.frequency.setValueAtTime(freq, now);
  osc.start(now);

  // Безопасное завершение — на всякий случай ограничим жизнь ноты
  const lifetime = 5; // сек
  osc.stop(now + lifetime);
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch (_) {}
    activeNotes.delete(midiNumber);
  };

  activeNotes.set(midiNumber, { osc, gain });
}

export function stopNote(midiNumber) {
  const note = activeNotes.get(midiNumber);
  if (!note) return;

  const now = audioCtx.currentTime;
  const { osc, gain } = note;

  try {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + ADSR.release);
    osc.stop(now + ADSR.release + 0.05);
  } catch (_) {}

  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch (_) {}
    activeNotes.delete(midiNumber);
  };
}
