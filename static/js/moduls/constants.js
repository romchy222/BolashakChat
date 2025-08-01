// constants.js

export const BOT_AVATAR = `<span class="bot-avatar" title="Bolashak AI"><span class="material-symbols-outlined">
robot_2
</span></span>`;
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
    value: 'ai_assistant',
    label: 'AI-ассистент',
    icon: '🧑‍💻'
  },
  {
    value: 'ai_navigator',
    label: 'AI-Навигатор',
    icon: '🧭'
  },
  {
    value: 'student_navigator',
    label: 'Навигатор студента',
    icon: '👨‍🎓'
  },
  {
    value: 'green_navigator',
    label: 'Green Navigator',
    icon: '🌱'
  },
  {
    value: 'communication',
    label: 'Коммуникации',
    icon: '💬'
  }
];