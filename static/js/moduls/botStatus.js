// botStatus.js

export function setupBotStatus(botStatus) {
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
}