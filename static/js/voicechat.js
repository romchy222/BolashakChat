let recognition = null, recognizing = false, speaking = false, muted = false;
const addBtn = document.getElementById('add-btn');
const overlay = document.getElementById('voice-overlay');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = document.getElementById('mute-icon');
const closeBtn = document.getElementById('close-btn');
const hint = document.getElementById('voice-hint');
const canvas = document.getElementById('voice-visual');
const ctx = canvas.getContext('2d');

// UI для выбора голоса и параметров Silero
const voiceSelect = document.getElementById('voice-select');
const rateInput = document.getElementById('rate-input');
const pitchInput = document.getElementById('pitch-input');
const rateLabel = document.getElementById('rate-label');
const pitchLabel = document.getElementById('pitch-label');

const SILERO_SPEAKERS = [
  {id: 'baya', label: 'Бая (женский)'},
  {id: 'kseniya', label: 'Ксения (женский)'},
  {id: 'xenia', label: 'Ксения-2 (женский)'},
  {id: 'aidar', label: 'Айдар (мужской)'}
];
const SILERO_EMOTIONS = [
  {id: 'neutral', label: 'Нейтрально'},
  {id: 'good', label: 'Дружелюбно'},
  {id: 'evil', label: 'Серьёзно'},
  {id: 'sad', label: 'Грустно'}
];

let selectedVoice = 'baya';
let selectedRate = 1;
let selectedPitch = 1; // Silero не поддерживает pitch, только speed!
let selectedEmotion = 'neutral';

let waveFrame = 0, waveActive = false, talking = false;
function drawCloudWave() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cx = canvas.width/2, cy = canvas.height/2, r = 80;
  const grad = ctx.createRadialGradient(cx,cy,30, cx,cy,80);
  grad.addColorStop(0,"#e2f3ff");
  grad.addColorStop(0.8,"#6bbfff");
  grad.addColorStop(1,"#2577ff");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2*Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();

  if (waveActive || talking) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r-3, 0, 2*Math.PI);
    ctx.clip();
    ctx.lineWidth = 2;
    for (let j=0;j<3;j++) {
      ctx.beginPath();
      for (let i=0;i<=180;i++) {
        const angle = Math.PI*i/180;
        const x = cx + (r-10) * Math.cos(angle);
        let base = cy + (r-10) * Math.sin(angle);
        let amp = talking ? 10+6*j : 6+4*j;
        let freq = talking ? 5-j : 4-j;
        let y = base + Math.sin(angle*freq + waveFrame/7+j) * amp * (1-j*0.33);
        i==0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${talking?0.33-0.1*j:0.22-0.07*j})`;
      ctx.stroke();
    }
    ctx.restore();
  }
  waveFrame++;
  if (overlay && !overlay.classList.contains("hidden")) requestAnimationFrame(drawCloudWave);
}

function setUI(stage) {
  console.log('setUI:', stage);
  if (stage === "ready") {
    hint.textContent = muted ? "Микрофон выключен" : "Скажите что-нибудь";
    waveActive = !muted;
    talking = false;
  }
  if (stage === "listen") {
    hint.textContent = "Говорите...";
    waveActive = true;
    talking = false;
  }
  if (stage === "wait") {
    hint.textContent = "Ответ загружается...";
    waveActive = true;
    talking = false;
  }
  if (stage === "speak") {
    hint.textContent = "Голосовой ответ...";
    waveActive = false;
    talking = true;
  }
}

function showOverlay() {
  console.log('showOverlay');
  overlay.classList.remove('hidden');
  muted = false;
  updateMuteUI();
  setUI("ready");
  drawCloudWave();
  autoStartRecognition();
}

function autoStartRecognition() {
  console.log('autoStartRecognition', {muted, recognizing, speaking});
  if (!muted && !recognizing && !speaking) {
    setTimeout(() => {
      if (!muted && !recognizing && !speaking) {
        recognition.lang = "ru-RU";
        try {
          recognition.start();
          console.log('recognition.start() called');
        } catch (err) {
          console.error('recognition.start() error:', err);
        }
      }
    }, 350);
  }
}

function updateMuteUI() {
  console.log('updateMuteUI:', muted);
  if (muted) {
    muteBtn.classList.add("muted");
    muteIcon.textContent = "mic_off";
  } else {
    muteBtn.classList.remove("muted");
    muteIcon.textContent = "mic";
  }
}

function showError(msg) {
  console.error('showError:', msg);
  let el = document.createElement('div');
  el.textContent = msg;
  el.className = "voice-error-popup";
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 700);
  }, 2500);
}

// ====== UI для Silero ======
function populateSileroVoiceList() {
  voiceSelect.innerHTML = '';
  SILERO_SPEAKERS.forEach((voice, i) => {
    const option = document.createElement('option');
    option.value = voice.id;
    option.textContent = voice.label;
    voiceSelect.appendChild(option);
  });
  voiceSelect.value = selectedVoice;
}
populateSileroVoiceList();

// Эмоции — можно сделать отдельный select (здесь просто переменная)
const emotionSelect = document.getElementById('emotion-select');
if (emotionSelect) {
  SILERO_EMOTIONS.forEach(em => {
    const option = document.createElement('option');
    option.value = em.id;
    option.textContent = em.label;
    emotionSelect.appendChild(option);
  });
  emotionSelect.value = selectedEmotion;
  emotionSelect.addEventListener('change', () => {
    selectedEmotion = emotionSelect.value;
    console.log('selectedEmotion:', selectedEmotion);
  });
}

// Слушаем выбор голоса и параметры
voiceSelect && voiceSelect.addEventListener('change', () => {
  selectedVoice = voiceSelect.value;
  console.log('selectedVoice:', selectedVoice);
});
rateInput && rateInput.addEventListener('input', () => {
  selectedRate = parseFloat(rateInput.value);
  rateLabel.textContent = selectedRate;
  console.log('selectedRate:', selectedRate);
});
pitchInput && pitchInput.addEventListener('input', () => {
  selectedPitch = parseFloat(pitchInput.value);
  pitchLabel.textContent = selectedPitch;
  console.log('selectedPitch:', selectedPitch);
});

// ====== Очистка текста для TTS ======
function cleanTextForTTS(text) {
  console.log('cleanTextForTTS input:', text);
  // Удаление эмодзи (все юникодные emoji)
  text = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g, '');
  // Удаление слэшей, одиночных знаков препинания, символов типа @, #, *, ^, ~, |, но НЕ точек, запятых, восклицательных/вопросительных знаков
  text = text.replace(/[\\/@#*^~|]/g, ' ');
  text = text.replace(/\b[\\/@#*^~|]\b/g, ' ');
  text = text.replace(/\s{2,}/g, ' ').trim();
  // Удаляем всё не буквы/цифры/пробел/.,!? (оставляем рус/англ, цифры, .,!?)
  text = text.replace(/[^a-zA-Zа-яА-Я0-9.,!? \-]/g, '');
  if (!text || text.length < 2 || /^[эаоыиeaoiy]+$/i.test(text)) {
    console.log('cleanTextForTTS output: EMPTY');
    return '';
  }
  console.log('cleanTextForTTS output:', text);
  return text;
}

// ====== SpeechRecognition ==========
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log('recognition onstart');
    recognizing = true;
    setUI("listen");
  };
  recognition.onend = () => {
    console.log('recognition onend');
    recognizing = false;
    if (!speaking && !muted) setUI("ready");
    if (!speaking && !muted) autoStartRecognition();
  };
  recognition.onerror = (e) => {
    console.error('recognition onerror:', e);
    setUI("ready");
    if (e.error !== "aborted" && e.error !== "no-speech") {
      showError("Ошибка микрофона: " + e.error);
      muted = true; updateMuteUI(); setUI("ready");
    }
  };
  recognition.onresult = (event) => {
    console.log('recognition onresult:', event);
    const transcript = event.results[0][0].transcript;
    console.log('transcript:', transcript);
    setUI("wait");
    // ОЗВУЧКА PLACEHOLDER
    playSileroTTS("Секунду, думаю...", () => {});
    // параллельно запрашиваем ответ ИИ
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: transcript })
    })
    .then(res => {
      console.log('/api/chat response:', res);
      return res.json();
    })
    .then(data => {
      console.log('/api/chat data:', data);
      const botReply = data.response || 'Извините, не удалось получить ответ.';
      setUI("speak");
      stopSileroPlayback();
      speaking = true;
      playSileroTTS(botReply, () => {
        speaking = false;
        setUI("ready");
        autoStartRecognition();
      });
    })
    .catch(err => {
      setUI("ready");
      stopSileroPlayback();
      showError("Ошибка сети: " + err.message);
      autoStartRecognition();
      console.error('fetch /api/chat error:', err);
    });
  };
} else {
  muteBtn.disabled = true;
  hint.textContent = "Голосовой ввод не поддерживается";
  console.error('SpeechRecognition not supported in this browser');
}

// ====== Silero TTS playback ======
let sileroAudio = null;
function stopSileroPlayback() {
  if (sileroAudio) {
    sileroAudio.pause();
    sileroAudio.src = "";
    sileroAudio = null;
    talking = false;
    console.log('stopSileroPlayback');
  }
}

async function playSileroTTS(text, onEnd) {
  stopSileroPlayback();
  text = cleanTextForTTS(text);
  if (!text) {
    console.warn('playSileroTTS: text is empty, skipping playback');
    if (onEnd) onEnd();
    return;
  }
  talking = true;
  drawCloudWave();
  try {
    // Формируем запрос к Silero API
    const sileroPayload = {
      text: text,
      speaker: selectedVoice,
      lang: "ru",
      sample_rate: 24000,
      speed: selectedRate,
      emotion: selectedEmotion
    };
    console.log('playSileroTTS fetch sileroPayload:', sileroPayload);
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "accept": "audio/mpeg",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sileroPayload)
    });
    console.log('playSileroTTS Silero response status:', resp.status);
    if (!resp.ok) throw new Error("Ошибка Silero TTS API: " + resp.status);
    const blob = await resp.blob();
    const audioUrl = URL.createObjectURL(blob);
    sileroAudio = new Audio(audioUrl);
    sileroAudio.onended = sileroAudio.onerror = () => {
      talking = false;
      sileroAudio = null;
      console.log('sileroAudio ended/errored');
      if (onEnd) onEnd();
    };
    sileroAudio.play().then(() => {
      console.log('sileroAudio playback started');
    }).catch(e => {
      console.error('sileroAudio.play() error:', e);
      talking = false;
      sileroAudio = null;
      if (onEnd) onEnd();
    });
  } catch (err) {
    talking = false;
    showError("Ошибка синтеза речи: " + err.message);
    console.error('playSileroTTS error:', err);
    if (onEnd) onEnd();
  }
}

// ========== Кнопки ==========
addBtn.onclick = () => { 
  console.log('addBtn.onclick');
  showOverlay(); 
};
muteBtn.onclick = () => {
  console.log('muteBtn.onclick');
  muted = !muted;
  updateMuteUI();
  if (muted && recognizing) recognition.stop();
  setUI("ready");
  if (!muted) autoStartRecognition();
  stopSileroPlayback();
};
closeBtn.onclick = () => {
  console.log('closeBtn.onclick');
  overlay.classList.add('hidden');
  muted = true;
  updateMuteUI();
  if (recognizing) recognition.stop();
  setUI("ready");
  stopSileroPlayback();
};