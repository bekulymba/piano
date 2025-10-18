// recorder.js
export function createRecorder() {
  let recordingName = 'Untitled';
  let baseTime = 0;
  let isRecording = false;

  // хранение начала нажатий: key -> startTimestamp (ms)
  const active = new Map();

  // итоговые ноты
  const notes = [];

  function now() {
    return performance.now();
  }

  function start(name = 'My Song') {
    recordingName = name;
    baseTime = now();
    isRecording = true;
    active.clear();
    notes.length = 0;
  }

  function stop() {
    if (!isRecording) {
      return getRecording();
    }

    // Заканчиваем активные ноты: закрываем их текущим временем
    const endTime = now();
    for (const [key, startTs] of active.entries()) {
      const start = startTs - baseTime;
      const duration = Math.max(0, endTime - startTs);
      notes.push({
        key,
        startTime: Math.round(start),
        duration: Math.round(duration)
      });
    }
    active.clear();

    isRecording = false;
    return getRecording();
  }

  function noteOn(key) {
    if (!isRecording) return;
    // если уже есть активная запись для этой ноты — игнорируем (не перезаписываем старт)
    if (active.has(key)) return;
    active.set(key, now());
  }

  function noteOff(key) {
    if (!isRecording) return;
    const startTs = active.get(key);
    if (startTs == null) return;
    const endTs = now();
    const start = Math.max(0, startTs - baseTime);
    const dur = Math.max(0, endTs - startTs);
    notes.push({
      key,
      startTime: Math.round(start),
      duration: Math.round(dur)
    });
    active.delete(key);
  }

  function getRecording() {
    const totalDuration = notes.length === 0 ? 0 : Math.max(...notes.map(n => n.startTime + n.duration));
    return {
      name: recordingName,
      duration: Math.round(totalDuration),
      notes: notes.slice().sort((a, b) => a.startTime - b.startTime)
    };
  }

  function exportJSON(filename = `${recordingName.replace(/\s+/g, '_') || 'recording'}.json`) {
    const data = getRecording();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    return { blob, url, filename, json };
  }

  return {
    start,
    stop,
    noteOn,
    noteOff,
    getRecording,
    exportJSON,
    isRecording: () => isRecording
  };
}
