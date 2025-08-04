const voiceOverlay = document.getElementById('voice-chat-overlay');
const voiceCircle = document.querySelector('.voice-circle');
const voiceExitBtn = document.querySelector('.voice-exit-btn');
const voiceChatBtn = document.getElementById('add-btn');

let recognition;

voiceChatBtn.addEventListener('click', () => {
  voiceOverlay.classList.remove('hidden');
  startVoiceRecognition();
});

voiceExitBtn.addEventListener('click', () => {
  voiceOverlay.classList.add('hidden');
  if (recognition) recognition.stop();
});

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.interimResults = false;

  recognition.onstart = () => {
    console.log('🎤 Слушаю...');
  };

  recognition.onresult = (event) => {
    const userText = event.results[0][0].transcript;
    console.log('Пользователь сказал:', userText);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    })
    .then(res => res.json())
    .then(data => {
      const botReply = data.response || 'Извините, не удалось получить ответ.';
      speak(botReply);
    });

    voiceOverlay.classList.add('hidden');
  };

  recognition.onerror = (event) => {
    console.error('Ошибка распознавания:', event);
    voiceOverlay.classList.add('hidden');
  };

  recognition.start();
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}
