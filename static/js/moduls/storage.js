// storage.js

import { LS_KEY } from './constants.js';

export function saveHistory(messages) {
  const filtered = messages.filter(msg => !msg.typing);
  localStorage.setItem(LS_KEY, JSON.stringify(filtered));
}

export function loadHistory() {
  try {
    return (JSON.parse(localStorage.getItem(LS_KEY) || "[]") || []).filter(msg => !msg.typing);
  } catch {
    return [];
  }
}