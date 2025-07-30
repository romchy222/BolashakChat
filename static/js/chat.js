// Bolashak Chat: пузырьки, аватар, автоскролл, язык, подсказки, быстрые кнопки, голос, копирование, localStorage, dark/light
// плюс: Bot is typing..., онлайн/оффлайн статус, горячие клавиши, плавная автопрокрутка

const BOT_AVATAR = `<span class="bot-avatar" title="Bolashak AI">🧿</span>`;
const TYPING_INDICATOR = `<span class="typing-indicator"><b>Бот печатает</b><span class="typing-dots"><span>.</span><span>.</span><span>.</span></span></span>`;
const SUGGESTIONS = [
  "Как поступить?",
  "Сроки подачи документов",
  "Какие программы есть?"
];
const LS_KEY = "bolashak_chat_history_v1";

// ДАННЫЕ ДЛЯ КАСТОМНОГО СЕЛЕКТОРА
const MODEL_OPTIONS = [
  {
    value: 'admission',
    label: 'Поступление',
    icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f916.svg'
  },
  {
    value: 'scholarship',
    label: 'Стипендия',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/OOjs_UI_icon_robot.svg'
  },
  {
    value: 'general',
    label: 'Общий',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Font_Awesome_5_solid_brain.svg'
  }
];

let currentLang = "ru";
let currentModel = "admission";
let recognizing = false;
let recognition = null;

function saveHistory(messages) {
  const filtered = messages.filter(msg => !msg.typing);
  localStorage.setItem(LS_KEY, JSON.stringify(filtered));
}
function loadHistory() {
  try {
    return (JSON.parse(localStorage.getItem(LS_KEY) || "[]") || []).filter(msg => !msg.typing);
  } catch {
    return [];
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatHistory = document.getElementById('chat-history');
  const suggestionsDiv = document.getElementById('suggestions');
  const langBtns = document.querySelectorAll('.lang-btn');
  const themeToggle = document.querySelector('.theme-toggle');
  const voiceBtn = document.getElementById('voice-btn');
  const botStatus = document.getElementById('bot-status');

  // кастомный селектор
  const modelSelectorCurrent = document.getElementById('modelSelectorCurrent');
  const modelSelectorDropdown = document.getElementById('modelSelectorDropdown');
  const modelSelectorList = document.getElementById('modelSelectorList');
  const modelSelectorSearch = document.getElementById('modelSelectorSearch');
  const modelSelectorLabel = modelSelectorCurrent ? modelSelectorCurrent.querySelector('.model-selector__label') : null;
  const modelSelectorIcon = modelSelectorCurrent ? modelSelectorCurrent.querySelector('.model-selector__icon') : null;
  const realModelInput = document.getElementById('model-select');

  // Инициализация кастомного селектора (создание списка из MODEL_OPTIONS)
  if (modelSelectorList && modelSelectorLabel && modelSelectorIcon && realModelInput) {
    modelSelectorList.innerHTML = MODEL_OPTIONS.map(opt => `
      <li data-value="${opt.value}"${opt.value === realModelInput.value ? ' class="selected"' : ''}>
        <img src="${opt.icon}" width="20" alt="${opt.label}" />
        ${opt.label}
      </li>
    `).join('');
    // поставить label и icon начальные
    let selected = MODEL_OPTIONS.find(o => o.value === realModelInput.value) || MODEL_OPTIONS[0];
    modelSelectorLabel.textContent = selected.label;
    modelSelectorIcon.innerHTML = `<img src="${selected.icon}" width="20" alt="${selected.label}" />`;
    currentModel = selected.value;
  }

  let messages = loadHistory();
  renderAllMessages();

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      chatInput.placeholder = currentLang === "ru" ? "Введите сообщение..." :
        currentLang === "kz" ? "Хабарлама енгізіңіз..." : "Type a message...";
      renderSuggestions();
    });
  });

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');

    if (document.body.classList.contains('theme-dark')) {
      themeToggle.innerHTML = '<span class="material-symbols-outlined">brightness_4</span>';
    } else {
      themeToggle.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
    }
  });

  // ======== КАСТОМНЫЙ СЕЛЕКТОР МОДЕЛИ ==========
  if (modelSelectorCurrent && modelSelectorDropdown && modelSelectorList && modelSelectorLabel && modelSelectorIcon && realModelInput) {
    // Toggle dropdown
    modelSelectorCurrent.onclick = () => {
      modelSelectorDropdown.classList.toggle('active');
      if (modelSelectorDropdown.classList.contains('active')) {
        modelSelectorSearch.value = '';
        modelSelectorSearch.focus();
        Array.from(modelSelectorList.children).forEach(li => li.style.display = '');
      }
    };

    // Hide dropdown on outside click
    document.addEventListener('mousedown', (e) => {
      if (!modelSelectorCurrent.contains(e.target) && !modelSelectorDropdown.contains(e.target)) {
        modelSelectorDropdown.classList.remove('active');
      }
    });

    // Select item
    modelSelectorList.onclick = (e) => {
      let li = e.target.closest('li');
      if (!li) return;
      modelSelectorList.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
      modelSelectorLabel.textContent = li.textContent.trim();
      modelSelectorIcon.innerHTML = li.querySelector('img').outerHTML;
      modelSelectorDropdown.classList.remove('active');
      realModelInput.value = li.dataset.value;
      currentModel = li.dataset.value;
    };

    // Search filter
    modelSelectorSearch.oninput = function() {
      let val = this.value.trim().toLowerCase();
      modelSelectorList.querySelectorAll('li').forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(val) ? '' : 'none';
      });
    };
  }
  // ======== КАСТОМНЫЙ СЕЛЕКТОР END ==========

  suggestionsDiv.addEventListener('click', e => {
    if (e.target.tagName === "BUTTON") {
      chatInput.value = e.target.textContent;
      chatInput.focus();
      suggestionsDiv.style.display = 'none';
    }
  });

  // Голосовой ввод
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

  chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage({ text: message, who: "user", lang: currentLang, model: currentModel });
    chatInput.value = '';
    chatInput.disabled = true;
    // modelSelect.disabled = true; // БОЛЬШЕ НЕ ТРЕБУЕТСЯ
    document.querySelector('.model-selector__current').classList.add('disabled');
    voiceBtn.disabled = true;

    suggestionsDiv.style.display = "none";

    // Тайпинг индикатор (НЕ сохраняем в messages/localStorage)
    renderMessage({ text: TYPING_INDICATOR, who: "bot", typing: true });

    try {
      const payload = {
        message,
        agent_type: currentModel,
        language: currentLang,
      };
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();

      removeTyping();

      if (data.error) {
        appendMessage({ text: data.error, who: "bot", error: true });
      } else {
        await typeBotMessage(data.response || "", { who: "bot" });
      }
    } catch (err) {
      removeTyping();
      appendMessage({ text: "Ошибка соединения. Попробуйте ещё раз.", who: "bot", error: true });
    } finally {
      chatInput.disabled = false;
      document.querySelector('.model-selector__current').classList.remove('disabled');
      voiceBtn.disabled = false;
      chatInput.focus();
    }
  });

  // Клавиатурные шорткаты
  document.addEventListener('keydown', function(e) {
    // Ctrl+Enter или Cmd+Enter — отправить сообщение
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === chatInput) {
        chatForm.requestSubmit();
        e.preventDefault();
      }
    }
    // / — быстрый фокус в поле ввода
    if (e.key === '/' && document.activeElement !== chatInput) {
      chatInput.focus();
      e.preventDefault();
    }
    // ↑ — редактировать последнее отправленное сообщение пользователя (по желанию)
    if (e.key === 'ArrowUp' && document.activeElement === chatInput && chatInput.value === '') {
      const lastUserMsg = [...messages].reverse().find(m => m.who === "user");
      if (lastUserMsg) {
        chatInput.value = lastUserMsg.text;
        chatInput.focus();
        e.preventDefault();
      }
    }
  });

  chatHistory.addEventListener('click', e => {
    if (e.target.classList.contains('copy-btn')) {
      const text = e.target.closest('.message-content').textContent;
      navigator.clipboard.writeText(text);
      e.target.textContent = "✅";
      setTimeout(() => e.target.textContent = "⧉", 1200);
    }
  });

  // Онлайн/оффлайн статус (healthcheck)
  async function checkBotStatus() {
    try {
      const resp = await fetch('/api/health');
      if (resp.ok) updateBotStatus(true);
      else updateBotStatus(false);
    } catch {
      updateBotStatus(false);
    }
  }
  function updateBotStatus(online) {
    const dot = botStatus.querySelector('.status-dot');
    const label = botStatus.querySelector('.status-label');
    if (online) {
      dot.classList.add('online');
      dot.classList.remove('offline');
      label.textContent = 'Online';
    } else {
      dot.classList.remove('online');
      dot.classList.add('offline');
      label.textContent = 'Offline';
    }
  }
  setInterval(checkBotStatus, 15000);
  checkBotStatus();

  // Плавная автопрокрутка
  function scrollDown(smooth = true) {
    chatHistory.scrollTo({
      top: chatHistory.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  function renderAllMessages() {
    chatHistory.innerHTML = '';
    (messages || []).forEach(msg => renderMessage(msg));
    scrollDown(false); // мгновенно при загрузке
    renderSuggestions();
  }

  function appendMessage(msg) {
    renderMessage(msg);
    if (!msg.typing) {
      messages.push(msg);
      saveHistory(messages);
    }
    scrollDown(true); // плавно при новом сообщении
  }

  function renderMessage(msg) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-${msg.who || "bot"}`;
    let innerHTML = "";

    if (msg.who === "bot") {
      innerHTML += BOT_AVATAR;
    }
    innerHTML += `<div class="message-content${msg.error ? " error" : ""}">${msg.text}</div>`;
    if (msg.who === "bot" && !msg.typing) {
      innerHTML += `<button class="copy-btn" title="Скопировать">⧉</button>`;
    }
    bubble.innerHTML = innerHTML;
    chatHistory.appendChild(bubble);
    scrollDown(true);
  }

  // Тайпинг эффект
  async function typeBotMessage(text, msgmeta) {
    let i = 0, out = "";
    const speed = 17 + Math.random() * 20;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble bubble-bot`;
    bubble.innerHTML = BOT_AVATAR + `<div class="message-content"></div><button class="copy-btn" title="Скопировать">⧉</button>`;
    const content = bubble.querySelector('.message-content');
    chatHistory.appendChild(bubble);
    scrollDown(true);
    for (; i < text.length; i++) {
      content.textContent = out + text[i];
      out += text[i];
      await new Promise(r => setTimeout(r, speed));
      scrollDown(true);
    }
    content.textContent = text;
    messages.push({ text, who: "bot", ...msgmeta });
    saveHistory(messages);
    scrollDown(true);
  }

  function removeTyping() {
    const typing = chatHistory.querySelectorAll('.message-content');
    typing.forEach(el => {
      if (el.innerHTML === TYPING_INDICATOR) el.parentElement.remove();
    });
    scrollDown(true);
  }

  function renderSuggestions() {
    if (messages.length === 0) {
      suggestionsDiv.innerHTML = SUGGESTIONS.map(txt => `<button>${txt}</button>`).join('');
      suggestionsDiv.style.display = 'flex';
    } else {
      suggestionsDiv.style.display = 'none';
    }
  }

  chatHistory.addEventListener('dblclick', () => {
    if (confirm("Сбросить историю чата?")) {
      messages = [];
      saveHistory(messages);
      renderAllMessages();
    }
  });
});