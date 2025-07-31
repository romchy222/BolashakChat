import { translations } from './i18n.js';

function setLanguage(lang) {
  // Переводим тексты
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (translations[lang][key]) {
      elem.textContent = translations[lang][key];
    }
  });
  // Переводим плейсхолдеры
  document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
    const key = elem.getAttribute('data-i18n-placeholder');
    if (translations[lang][key]) {
      elem.placeholder = translations[lang][key];
    }
  });
  // Сохраняем выбранный язык
  localStorage.setItem('lang', lang);
}

// Слушаем клики по языкам (пример для выпадающего меню)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-dropdown-content a').forEach(link => {
    link.addEventListener('click', function(e){
      e.preventDefault();
      const lang = this.getAttribute('href').replace('#','');
      setLanguage(lang);
    });
  });
  // При загрузке — восстановить язык
  const savedLang = localStorage.getItem('lang') || 'ru';
  setLanguage(savedLang);
});