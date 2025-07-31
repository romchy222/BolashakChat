// constants.js

export const BOT_AVATAR = `<span class="bot-avatar" title="Bolashak AI">🧿</span>`;
export const TYPING_INDICATOR = `<span class="typing-indicator"><b>Бот печатает</b><span class="typing-dots"><span>.</span><span>.</span>.</span></span>`;
export const SUGGESTIONS = [
  // "Как поступить?",
  // "Сроки подачи документов",
  // "Какие программы есть?"
];
export const LS_KEY = "bolashak_chat_history_v1";

// ДАННЫЕ ДЛЯ КАСТОМНОГО СЕЛЕКТОРА (вернулись к Поступление/Стипендия/Общий)
export const MODEL_OPTIONS = [
  {
    value: 'admission',
    label: 'Поступление',
    icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f916.svg'
  },
  {
    value: 'scholarship',
    label: 'Стипендия',
    icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f393.svg'
  },
  {
    value: 'general',
    label: 'Общий',
    icon: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e0.svg'
  }
];