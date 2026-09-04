function renderWeekly() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const grid = document.getElementById('weeklyGrid');
  grid.innerHTML = '';

  TEAM_DEF.forEach((m, i) => {
    const weekActs = allActivities.filter(a => a.memberId === m.id && new Date(a.createdAt) >= weekAgo);
    const totalActs = weekActs.length;
    const musteriActs = weekActs.filter(a => a.fieldKey === 'musteri').length;
    const temasActs = weekActs.filter(a => a.fieldKey === 'temas').length;
    const teklifActs = weekActs.filter(a => a.fieldKey === 'teklif').length;

    const card = document.createElement('div');
    card.className = 'weekly-card';
    card.style.animationDelay = (0.07 * i) + 's';

    const isSales = m.dept === 'Satış';
    const statsHtml = isSales ? `
      <div class="weekly-stat"><span>🤝 Yeni Müşteri</span><span class="weekly-stat-val" style="color:${m.deptColor}">${musteriActs}</span></div>
      <div class="weekly-stat"><span>📞 Temas</span><span class="weekly-stat-val" style="color:${m.deptColor}">${temasActs}</span></div>
      <div class="weekly-stat"><span>📄 Teklif</span><span class="weekly-stat-val" style="color:${m.deptColor}">${teklifActs}</span></div>
    ` : Object.entries(weekActs.reduce((acc, a) => { acc[a.fieldLabel] = (acc[a.fieldLabel] || 0) + 1; return acc; }, {}))
      .map(([lbl, cnt]) => `<div class="weekly-stat"><span>${lbl}</span><span class="weekly-stat-val" style="color:${m.deptColor}">${cnt}</span></div>`).join('');

    card.innerHTML = `
      <div class="weekly-card-header">
        <div class="avatar" style="background:${m.avatarBg};color:${m.deptColor};width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:0.9rem;flex-shrink:0">${m.initials}</div>
        <div><div class="weekly-member-name">${m.name}</div><div class="weekly-member-dept">${m.dept} · Bu hafta ${totalActs} aktivite</div></div>
      </div>
      ${statsHtml || '<div style="font-size:0.82rem;color:var(--ink3);text-align:center;padding:0.5rem">Bu hafta aktivite yok</div>'}
    `;
    grid.appendChild(card);
  });
}

function showTakipPopup() {
  const myId = currentUser.memberId;
  let takipList = (currentUser.role === 'admin' || currentUser.role === 'viewer')
    ? allActivities.filter(a => a.status === 'Takip')
    : allActivities.filter(a => a.status === 'Takip' && a.memberId === myId);

  if (!takipList.length) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.3s ease';
  overlay.innerHTML = `
    <div style="background:var(--surface);border-radius:20px;padding:2rem;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
        <div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:0.08em;color:var(--ink)">🔄 Takip Listesi</div>
          <div style="font-size:0.78rem;color:var(--ink3)">${takipList.length} bekleyen takip kaydın var</div>
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:0.4rem 0.75rem;cursor:pointer;font-size:0.82rem;color:var(--ink)">Kapat</button>
      </div>
      ${takipList.map(a => `
        <div style="background:var(--bg);border-radius:12px;padding:1rem;margin-bottom:0.75rem;border-left:3px solid #457b9d">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;flex-wrap:wrap">
            <span style="font-weight:700;font-size:0.85rem;color:var(--ink)">${a.memberName}</span>
            <span style="font-size:0.72rem;color:var(--ink3)">·</span>
            <span style="font-size:0.72rem;font-weight:600;color:#457b9d">${a.fieldEmoji} ${a.fieldLabel}</span>
            <span style="font-size:0.7rem;color:var(--ink3);margin-left:auto">📅 ${a.date}</span>
          </div>
          <div style="font-size:0.82rem;color:var(--ink2);margin-bottom:0.3rem">${a.desc}</div>
          ${a.company ? `<div style="font-size:0.75rem;color:var(--ink3)">🏢 ${a.company}</div>` : ''}
        </div>
      `).join('')}
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

