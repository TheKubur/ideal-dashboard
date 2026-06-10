
document.addEventListener('DOMContentLoaded', function () {
  const monthSel = document.getElementById('monthSel');
  if (monthSel) {
    monthSel.value = currentMonth;
  }
  const yearSel = document.getElementById('yearSel');
  if (yearSel) {
    const curY = new Date().getFullYear();
    for (let y = 2024; y <= curY + 5; y++) {
      yearSel.innerHTML += `<option value="${y}">${y}</option>`;
    }
    yearSel.value = currentYear;
  }
  const currPeriodEl = document.getElementById('currentPeriod');
  if (currPeriodEl) currPeriodEl.textContent = currentPeriod;

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  const loginPass = document.getElementById('loginPass');
  if (loginPass) loginPass.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });

  // ====== MAGIC HOVER GLOW EFFECT ======
  const addGlow = () => {
    document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card').forEach(card => {
      if (!card.querySelector('.magic-glow')) {
        const glow = document.createElement('div');
        glow.className = 'magic-glow';
        card.appendChild(glow);
      }
    });
  };
  const observer = new MutationObserver(() => addGlow());
  observer.observe(document.body, { childList: true, subtree: true });
  addGlow();

  document.addEventListener('mousemove', e => {
    for (const card of document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card')) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  });
});

