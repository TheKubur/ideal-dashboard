const BADGES = [
  { id: 'ilk_musteri', icon: '🥇', label: 'İlk Müşteri', check: (c, a) => c >= 1 },
  { id: 'musteri_5', icon: '🏆', label: '5 Müşteri', check: (c, a) => c >= 5 },
  { id: 'musteri_10', icon: '💎', label: '10 Müşteri', check: (c, a) => c >= 10 },
  { id: 'aktivite_10', icon: '⚡', label: '10 Aktivite', check: (c, a) => a >= 10 },
  { id: 'aktivite_50', icon: '🚀', label: '50 Aktivite', check: (c, a) => a >= 50 },
  { id: 'crm_star', icon: '📋', label: 'CRM Ustası', check: (c, a, crm) => crm >= 20 },
];

function renderBadges(totalMusteri, totalCRM) {
  const totalActs = allActivities.length;
  const badgeEl = document.getElementById('badgeStrip');
  if (!badgeEl) return;
  badgeEl.innerHTML = BADGES.map(b => {
    const earned = b.check(totalMusteri, totalActs, totalCRM);
    return `<div style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.75rem;border-radius:99px;border:1px solid ${earned ? 'var(--gold)' : 'var(--border)'};background:${earned ? 'rgba(244,162,97,0.12)' : 'transparent'};font-size:0.75rem;font-weight:600;color:${earned ? 'var(--gold)' : 'var(--ink3)'}">
      ${b.icon} ${b.label}
    </div>`;
  }).join('');
}

