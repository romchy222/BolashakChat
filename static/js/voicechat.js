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

// Агент селектор для голосового чата
const agentSelect = document.getElementById('agent-select');

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
let selectedAgent = 'ai_assistant';

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

// ====== UI для агентов ======
const AGENT_OPTIONS = [
  {id: 'ai_assistant', label: 'AI-Ассистент'},
  {id: 'ai_navigator', label: 'AI-Навигатор'},
  {id: 'student_navigator', label: 'Студенческий навигатор'},
  {id: 'green_navigator', label: 'GreenNavigator'},
  {id: 'communication', label: 'Коммуникации'}
];

function populateAgentSelect() {
  if (agentSelect) {
    agentSelect.innerHTML = '';
    AGENT_OPTIONS.forEach(agent => {
      const option = document.createElement('option');
      option.value = agent.id;
      option.textContent = agent.label;
      agentSelect.appendChild(option);
    });
    agentSelect.value = selectedAgent;
    agentSelect.addEventListener('change', () => {
      selectedAgent = agentSelect.value;
      console.log('selectedAgent:', selectedAgent);
    });
  }
}
populateAgentSelect();
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
    
    // Оптимизированный запрос к ИИ с выбранным агентом
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: transcript,
        agent_type: selectedAgent,
        language: 'ru'
      })
    })
    .then(res => {
      console.log('/api/chat response:', res);
      return res.json();
    })
    .then(data => {
      console.log('/api/chat data:', data);
      const botReply = data.response || 'Извините, не удалось получить ответ.';
      setUI("speak");
      speaking = true;
      playBrowserTTS(botReply, () => {
        speaking = false;
        setUI("ready");
        autoStartRecognition();
      });
    })
    .catch(err => {
      setUI("ready");
      stopBrowserTTS();
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

// ====== Browser Native TTS playback (Free, No Limits) ======
let currentSpeech = null;

function stopBrowserTTS() {
  if (currentSpeech) {
    window.speechSynthesis.cancel();
    currentSpeech = null;
    talking = false;
    console.log('stopBrowserTTS: speech cancelled');
  }
}

async function playBrowserTTS(text, onEnd) {
  stopBrowserTTS();
  text = cleanTextForTTS(text);
  if (!text) {
    console.warn('playBrowserTTS: text is empty, skipping playback');
    if (onEnd) onEnd();
    return;
  }
  
  // Check if browser supports Speech Synthesis
  if (!('speechSynthesis' in window)) {
    showError("Ваш браузер не поддерживает синтез речи");
    if (onEnd) onEnd();
    return;
  }
  
  talking = true;
  drawCloudWave();
  
  try {
    // Get TTS config from server (for consistency, though we could skip this)
    const configPayload = {
      text: text,
      speaker: selectedVoice,
      lang: "ru",
      speed: selectedRate,
      emotion: selectedEmotion
    };
    
    console.log('playBrowserTTS config payload:', configPayload);
    
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(configPayload)
    });
    
    const result = await resp.json();
    console.log('playBrowserTTS server response:', result);
    
    // Use browser's native Speech Synthesis API
    currentSpeech = new SpeechSynthesisUtterance(text);
    
    // Configure speech parameters
    currentSpeech.lang = 'ru-RU';
    currentSpeech.rate = selectedRate;
    currentSpeech.pitch = 1.0;
    currentSpeech.volume = 1.0;
    
    // Try to find a suitable voice
    const voices = speechSynthesis.getVoices();
    const russianVoice = voices.find(voice => 
      voice.lang.startsWith('ru') || 
      voice.name.toLowerCase().includes('rus') ||
      voice.name.toLowerCase().includes('anna') ||
      voice.name.toLowerCase().includes('pavel')
    );
    
    if (russianVoice) {
      currentSpeech.voice = russianVoice;
      console.log('Using voice:', russianVoice.name);
    } else {
      console.log('No Russian voice found, using default');
    }
    
    // Set up event handlers
    currentSpeech.onstart = () => {
      console.log('Browser TTS started');
    };
    
    currentSpeech.onend = () => {
      talking = false;
      currentSpeech = null;
      console.log('Browser TTS ended');
      if (onEnd) onEnd();
    };
    
    currentSpeech.onerror = (event) => {
      talking = false;
      currentSpeech = null;
      console.error('Browser TTS error:', event);
      showError("Ошибка воспроизведения речи: " + event.error);
      if (onEnd) onEnd();
    };
    
    // Start speech synthesis
    speechSynthesis.speak(currentSpeech);
    console.log('Browser TTS speech started');
    
  } catch (err) {
    talking = false;
    currentSpeech = null;
    showError("Ошибка синтеза речи: " + err.message);
    console.error('playBrowserTTS error:', err);
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
  stopBrowserTTS();
};
closeBtn.onclick = () => {
  console.log('closeBtn.onclick');
  overlay.classList.add('hidden');
  muted = true;
  updateMuteUI();
  if (recognizing) recognition.stop();
  setUI("ready");
  stopBrowserTTS();
};