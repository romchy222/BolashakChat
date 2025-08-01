import { BOT_AVATAR, TYPING_INDICATOR, SUGGESTIONS } from './constants.js';
import { saveHistory } from './storage.js';

// Добавить сообщение (или заменить typing)
export function appendMessage(msg, messages, chatHistory, renderMessage) {
  if (msg.replaceTyping) {
    replaceTypingWithAnswer(msg, chatHistory);
    // Добавляем в messages только если не typing
    messages.push({ ...msg, who: "bot" });
    saveHistory(messages);
  } else {
    renderMessage(msg, chatHistory);
    if (!msg.typing) {
      messages.push(msg);
      saveHistory(messages);
    }
    scrollDown(chatHistory, true);
  }
}

// Заменяет typing bubble на ответ (ищет только по DOM)
function replaceTypingWithAnswer(msg, chatHistory) {
  const bubble = chatHistory.querySelector('.chat-bubble.bubble-bot[data-typing="true"]');
  if (bubble) {
    const content = bubble.querySelector('.message-content');
    if (content) {
      if (window.marked && typeof window.marked.parse === "function") {
        content.innerHTML = window.marked.parse(msg.text);
      } else {
        content.textContent = msg.text;
      }
      bubble.removeAttribute('data-typing');
    }
  } else {
    // Если не нашли typing bubble — добавить как новое сообщение
    renderMessage(msg, chatHistory);
    scrollDown(chatHistory, true);
  }
}

// Рендер всех сообщений
export function renderAllMessages(messages, chatHistory, renderMessage, renderSuggestions) {
  chatHistory.innerHTML = '';
  (messages || []).forEach(msg => renderMessage(msg, chatHistory));
  scrollDown(chatHistory, false);
  renderSuggestions();
}
export function removeTyping(chatHistory) {
  const typing = chatHistory.querySelectorAll('.message-content');
  typing.forEach(el => {
    if (el.innerHTML === TYPING_INDICATOR) el.parentElement.remove();
  });
  scrollDown(chatHistory, true);
}
// Рендер одного сообщения (c data-typing)
export function renderMessage(msg, chatHistory) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${msg.who || "bot"}`;
  if (msg.typing) bubble.setAttribute('data-typing', 'true');
  let innerHTML = "";

  if (msg.who === "bot") {
    innerHTML += BOT_AVATAR;
  }

  const formatted = (window.marked && typeof window.marked.parse === "function")
    ? window.marked.parse(msg.text)
    : msg.text;

  innerHTML += `<div class="message-content${msg.error ? " error" : ""}">${formatted}</div>`;
  bubble.innerHTML = innerHTML;
  chatHistory.appendChild(bubble);
  scrollDown(chatHistory, true);
}

// Тайпинг эффект для ответа бота (можно не использовать, если идёт замена через appendMessage)
export async function typeBotMessage(text, msgmeta, messages, chatHistory) {
  appendMessage({ text, who: "bot", ...msgmeta, replaceTyping: true }, messages, chatHistory, renderMessage);
}

// Остальные функции без изменений
export function renderSuggestions(messages, suggestionsDiv) {
  if (messages.length === 0) {
    suggestionsDiv.innerHTML = SUGGESTIONS.map(txt => `<button>${txt}</button>`).join('');
    suggestionsDiv.style.display = 'flex';
  } else {
    suggestionsDiv.style.display = 'none';
  }
}

export function scrollDown(chatHistory, smooth = true) {
  chatHistory.scrollTo({
    top: chatHistory.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  });
}