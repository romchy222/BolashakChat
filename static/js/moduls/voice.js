// voice.js

export function setupVoiceInput({ voiceBtn, chatInput, currentLang }) {
  let recognizing = false;
  let recognition = null;

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      recognizing = true;
      voiceBtn.classList.add('active');
    };
    recognition.onend = () => {
      recognizing = false;
      voiceBtn.classList.remove('active');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.focus();
    };
    voiceBtn.addEventListener('click', () => {
      if (recognizing) {
        recognition.stop();
      } else {
        recognition.lang =
          currentLang === "kz" ? "kk-KZ" :
          currentLang === "en" ? "en-US" : "ru-RU";
        recognition.start();
      }
    });
  } else {
    voiceBtn.style.display = "none";
  }
}