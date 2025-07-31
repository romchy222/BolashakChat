// render.js

import { BOT_AVATAR, TYPING_INDICATOR, SUGGESTIONS } from './constants.js';
import { saveHistory } from './storage.js';

export function renderAllMessages(messages, chatHistory, renderMessage, renderSuggestions) {
  chatHistory.innerHTML = '';
  (messages || []).forEach(msg => renderMessage(msg, chatHistory));
  scrollDown(chatHistory, false); // мгновенно при загрузке
  renderSuggestions();
}

export function appendMessage(msg, messages, chatHistory, renderMessage) {
  renderMessage(msg, chatHistory);
  if (!msg.typing) {
    messages.push(msg);
    saveHistory(messages);
  }
  scrollDown(chatHistory, true); // плавно при новом сообщении
}

export function renderMessage(msg, chatHistory) {
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
  scrollDown(chatHistory, true);
}

// Тайпинг эффект
export async function typeBotMessage(text, msgmeta, messages, chatHistory) {
  let i = 0, out = "";
  const speed = 17 + Math.random() * 20;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-bot`;
  bubble.innerHTML = BOT_AVATAR + `<div class="message-content"></div><button class="copy-btn" title="Скопировать"><span class="material-symbols-outlined">
content_copy
</span></button>`;
  const content = bubble.querySelector('.message-content');
  chatHistory.appendChild(bubble);
  scrollDown(chatHistory, true);
  for (; i < text.length; i++) {
    content.textContent = out + text[i];
    out += text[i];
    await new Promise(r => setTimeout(r, speed));
    scrollDown(chatHistory, true);
  }
  content.textContent = text;
  messages.push({ text, who: "bot", ...msgmeta });
  saveHistory(messages);
  scrollDown(chatHistory, true);
}

export function removeTyping(chatHistory) {
  const typing = chatHistory.querySelectorAll('.message-content');
  typing.forEach(el => {
    if (el.innerHTML === TYPING_INDICATOR) el.parentElement.remove();
  });
  scrollDown(chatHistory, true);
}

export function renderSuggestions(messages, suggestionsDiv) {
  if (messages.length === 0) {
    suggestionsDiv.innerHTML = SUGGESTIONS.map(txt => `<button>${txt}</button>`).join('');
    suggestionsDiv.style.display = 'flex';
  } else {
    suggestionsDiv.style.display = 'none';
  }
}

// Плавная автопрокрутка
export function scrollDown(chatHistory, smooth = true) {
  chatHistory.scrollTo({
    top: chatHistory.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  });
}