// main.js

import { BOT_AVATAR, TYPING_INDICATOR, SUGGESTIONS, MODEL_OPTIONS } from './moduls/constants.js';
import { saveHistory, loadHistory } from './moduls/storage.js';
import { setupModelSelector } from './moduls/modelSelector.js';
import { renderAllMessages, appendMessage, renderMessage, typeBotMessage, removeTyping, renderSuggestions } from './moduls/render.js';
import { setupVoiceInput } from './moduls/voice.js';
import { setupBotStatus } from './moduls/botStatus.js';

let currentLang = "ru";
let currentModel = MODEL_OPTIONS[0].value;

document.addEventListener('DOMContentLoaded', function () {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatHistory = document.getElementById('chat-history');
  const suggestionsDiv = document.getElementById('suggestions');
  const langBtns = document.querySelectorAll('.lang-btn');
  const themeToggle = document.querySelector('.theme-toggle');
  const voiceBtn = document.getElementById('voice-btn');
  const botStatus = document.getElementById('bot-status');

  // кастомный селектор (Поступление/Стипендия/Общий)
  const modelSelectorCurrent = document.getElementById('providerSelector');
  const modelSelectorDropdown = document.getElementById('modelDropdown');
  const modelSelectorList = document.getElementById('modelList');
  const modelSelectorSearch = document.getElementById('modelSearch');
  const realModelInput = document.getElementById('selectedModel');

  setupModelSelector({
    modelSelectorCurrent,
    modelSelectorDropdown,
    modelSelectorList,
    modelSelectorSearch,
    realModelInput,
    setCurrentModel: model => currentModel = model,
  });

  let messages = loadHistory();
  renderAllMessages(messages, chatHistory, (msg, ch) => renderMessage(msg, ch), () => renderSuggestions(messages, suggestionsDiv));

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      chatInput.placeholder = currentLang === "ru" ? "Введите сообщение..." :
        currentLang === "kz" ? "Хабарлама енгізіңіз..." : "Type a message...";
      renderSuggestions(messages, suggestionsDiv);
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

  suggestionsDiv.addEventListener('click', e => {
    if (e.target.tagName === "BUTTON") {
      chatInput.value = e.target.textContent;
      chatInput.focus();
      suggestionsDiv.style.display = 'none';
    }
  });

  setupVoiceInput({ voiceBtn, chatInput, currentLang });

  chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage({ text: message, who: "user", lang: currentLang, model: currentModel }, messages, chatHistory, (msg, ch) => renderMessage(msg, ch));
    chatInput.value = '';
    chatInput.disabled = true;
    modelSelectorCurrent.classList.add('disabled');
    voiceBtn.disabled = true;

    suggestionsDiv.style.display = "none";

    // Тайпинг индикатор (НЕ сохраняем в messages/localStorage)
    renderMessage({ text: TYPING_INDICATOR, who: "bot", typing: true }, chatHistory);

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

      removeTyping(chatHistory);

      if (data.error) {
        appendMessage({ text: data.error, who: "bot", error: true }, messages, chatHistory, (msg, ch) => renderMessage(msg, ch));
      } else {
        await typeBotMessage(data.response || "", { who: "bot" }, messages, chatHistory);
      }
    } catch (err) {
      removeTyping(chatHistory);
      appendMessage({ text: "Ошибка соединения. Попробуйте ещё раз.", who: "bot", error: true }, messages, chatHistory, (msg, ch) => renderMessage(msg, ch));
    } finally {
      chatInput.disabled = false;
      modelSelectorCurrent.classList.remove('disabled');
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

  setupBotStatus(botStatus);

  chatHistory.addEventListener('dblclick', () => {
    if (confirm("Сбросить историю чата?")) {
      messages = [];
      saveHistory(messages);
      renderAllMessages(messages, chatHistory, (msg, ch) => renderMessage(msg, ch), () => renderSuggestions(messages, suggestionsDiv));
    }
  });
});