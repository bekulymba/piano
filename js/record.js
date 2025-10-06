const modeButtons = document.querySelectorAll('.mode-btn');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

const recordingIndicator = document.getElementById('recordingIndicator');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

let isRecording = false;
let isPlaying = false;
let progress = 0;
let progressInterval;

// Переключение режимов
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Запись
recordBtn.addEventListener('click', () => {
  if (isRecording) return;
  isRecording = true;
  recordingIndicator.classList.remove('hidden');
  progressContainer.classList.add('hidden');
});

// Проигрывание
playBtn.addEventListener('click', () => {
  if (isPlaying) return;
  isRecording = false;
  recordingIndicator.classList.add('hidden');
  isPlaying = true;
  progress = 0;
  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressInterval = setInterval(() => {
    progress += 1;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(progressInterval);
      isPlaying = false;
    }
  }, 100);
});

// Пауза
pauseBtn.addEventListener('click', () => {
  if (isPlaying) {
    clearInterval(progressInterval);
    isPlaying = false;
  }
});

// Стоп
stopBtn.addEventListener('click', () => {
  isRecording = false;
  isPlaying = false;
  clearInterval(progressInterval);
  recordingIndicator.classList.add('hidden');
  progressContainer.classList.add('hidden');
});
