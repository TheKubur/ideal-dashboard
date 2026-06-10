// ====== MAGIC HOVER GLOW EFFECT ======
document.addEventListener('DOMContentLoaded', () => {
  const addGlow = () => {
    document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card, .kanban-glow-target').forEach(card => {
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
    for (const card of document.querySelectorAll('.kpi-card, .member-card, .activity-item, .chart-card, .weekly-card, .private-note-card, .kanban-glow-target')) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  });
});

