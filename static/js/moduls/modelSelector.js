import { MODEL_OPTIONS } from './constants.js';

export function setupModelSelector({
  modelSelectorCurrent,
  modelSelectorDropdown,
  modelSelectorList,
  modelSelectorSearch,
  realModelInput,
  setCurrentModel
}) {
  // 1. Заголовок - всегда BolashAI
  modelSelectorCurrent.innerHTML = `
    BolashakAI <span class="model-panel-arrow">&#9662;</span>
  `;
  console.log('[ModelSelector] Заголовок установлен: BolashAI');

  // 2. Показываем дропдаун
  modelSelectorCurrent.onclick = function () {
    const willShow = modelSelectorDropdown.style.display !== 'block';
    modelSelectorDropdown.style.display = willShow ? 'block' : 'none';
    console.log(`[ModelSelector] Дропдаун ${willShow ? 'открыт' : 'закрыт'}`);
    modelSelectorSearch.value = '';
    Array.from(modelSelectorList.children).forEach(li => li.style.display = '');
  };

  // 3. Клик вне меню — закрыть дропдаун
  document.addEventListener('mousedown', (e) => {
    if (!modelSelectorCurrent.contains(e.target) && !modelSelectorDropdown.contains(e.target)) {
      if (modelSelectorDropdown.style.display === 'block') {
        modelSelectorDropdown.style.display = 'none';
        console.log('[ModelSelector] Дропдаун закрыт кликом вне');
      }
    }
  });

  // 4. Отметка выбранного (selected + галочка)
  modelSelectorList.onclick = (e) => {
    const li = e.target.closest('li');
    if (!li) {
      console.log('[ModelSelector] Клик вне li элемента');
      return;
    }
    // Снять выделение со всех
    Array.from(modelSelectorList.children).forEach(x => x.classList.remove('selected'));
    li.classList.add('selected');
    // Обновить скрытое поле
    realModelInput.value = li.dataset.value;
    modelSelectorDropdown.style.display = 'none';
    console.log(`[ModelSelector] Выбрана модель: ${li.dataset.value}`);
    if (typeof setCurrentModel === "function") {
      setCurrentModel(li.dataset.value);
      console.log('[ModelSelector] setCurrentModel вызван');
    }
  };

  // 5. Поиск по моделям
  modelSelectorSearch.oninput = function () {
    const val = this.value.trim().toLowerCase();
    console.log(`[ModelSelector] Поиск по моделям: "${val}"`);
    Array.from(modelSelectorList.children).forEach(li => {
      const match = li.textContent.toLowerCase().includes(val);
      li.style.display = match ? '' : 'none';
      if (match) {
        console.log(`[ModelSelector] Совпадение: "${li.textContent.trim()}"`);
      }
    });
  };

  // 6. Отметить выбранную модель при инициализации
  Array.from(modelSelectorList.children).forEach(li => {
    if (li.dataset.value === realModelInput.value) {
      li.classList.add('selected');
      console.log(`[ModelSelector] Модель по умолчанию выделена: ${li.dataset.value}`);
    } else {
      li.classList.remove('selected');
    }
  });
}