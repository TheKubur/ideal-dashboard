function renderWeeklySummary() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const weekActs = allActivities.filter(a => new Date(a.createdAt) >= weekAgo);
  const el = document.getElementById('weeklySummaryBox');
  if (!el) return;
  if (!weekActs.length) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const totalThisWeek = weekActs.length;
  const musteri = weekActs.filter(a => a.fieldKey === 'musteri').length;
  const temas = weekActs.filter(a => a.fieldKey === 'temas').length;
  const teklif = weekActs.filter(a => a.fieldKey === 'teklif').length;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
      <span style="font-size:0.82rem;font-weight:700;color:var(--ink2)">📊 Bu Hafta:</span>
      <span style="font-size:0.78rem;color:var(--ink3)">${totalThisWeek} aktivite</span>
      ${musteri ? `<span style="font-size:0.78rem;color:#e63946">🤝 ${musteri} müşteri</span>` : ''}
      ${temas ? `<span style="font-size:0.78rem;color:#457b9d">📞 ${temas} temas</span>` : ''}
      ${teklif ? `<span style="font-size:0.78rem;color:#f4a261">📄 ${teklif} teklif</span>` : ''}
    </div>
  `;
}

function renderLeaderboard() {
  const lb = document.getElementById('leaderboard');
  if (!lb) return;
  lb.innerHTML = '';
  const rankStyles = ['gold', 'silver', 'bronze'];
  sorted.forEach((m, i) => {
    const rank = rankStyles[i] || 'default';
    const mf = liveData[m.id]['musteri'];
    const tf = liveData[m.id]['teklif'];
    const actCount = allActivities.filter(a => a.memberId === m.id).length;
    const sub = mf ? `${mf.actual} müşteri${tf ? ' · ' + tf.actual + ' teklif' : ''}` : Object.values(liveData[m.id]).reduce((s, v) => s + v.actual, 0) + ' içerik';
    const row = document.createElement('div'); row.className = 'lb-row';
    const rankBadge = rank === 'default'
      ? `<div class="lb-rank" style="background:var(--bg);color:var(--ink3);border:1px solid var(--border)">${i + 1}</div>`
      : `<div class="lb-rank ${rank}">${i + 1}</div>`;
    row.innerHTML = `
      ${rankBadge}
      <div class="avatar" style="background:${m.avatarBg};color:${m.deptColor};width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:0.82rem;flex-shrink:0">${m.initials}</div>
      <div style="flex:1"><div class="lb-name" style="color:var(--ink)">${m.name}</div><div class="lb-dept">${m.dept} · ${sub} · ${actCount} aktivite</div></div>
      <div class="lb-bar-wrap"><div class="lb-bar-track"><div class="lb-bar-fill" style="width:${m.overall}%;background:${pctColor(m.overall)}"></div></div></div>
      <div class="lb-score" style="color:${pctColor(m.overall)}">${m.overall > 0 ? '%' + m.overall : '—'}</div>`;
    lb.appendChild(row);
  });
}

function renderDonut() {
  const canvas = document.getElementById('donutChart'); const ctx = canvas.getContext('2d');
  const depts = {};
  TEAM_DEF.forEach(m => {
    const mf = liveData[m.id]['musteri'];
    const total = mf ? mf.actual : Object.values(liveData[m.id]).reduce((s, v) => s + v.actual, 0);
    depts[m.dept] = (depts[m.dept] || 0) + total;
  });
  const total = Object.values(depts).reduce((a, b) => a + b, 0) || 1;
  const colors = { 'Satış': '#e63946', 'Dijital Pazarlama': '#457b9d' };
  ctx.clearRect(0, 0, 120, 120);
  let start = -Math.PI / 2;
  Object.entries(depts).forEach(([dept, val]) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(60, 60); ctx.arc(60, 60, 50, start, start + slice); ctx.closePath();
    ctx.fillStyle = colors[dept] || '#ccc'; ctx.fill(); start += slice;
  });
  ctx.beginPath(); ctx.arc(60, 60, 27, 0, Math.PI * 2); ctx.fillStyle = '#020617'; ctx.fill();
  const legend = document.getElementById('donutLegend'); legend.innerHTML = '';
  Object.entries(depts).forEach(([dept, val]) => {
    legend.innerHTML += `<div class="legend-item"><div class="legend-dot" style="background:${colors[dept] || '#ccc'}"></div><div><div style="font-weight:600;font-size:0.76rem;color:var(--ink)">${dept}</div><div style="font-size:0.68rem;color:var(--ink3)">${val} kayıt</div></div></div>`;
  });
}

function renderBarChart() {
  const TREND = [2, 4, 3, 5, 0, 0], LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
  const chart = document.getElementById('barChart'); chart.innerHTML = '';
  const max = Math.max(...TREND, 1);
  TREND.forEach((v, i) => {
    const col = document.createElement('div'); col.className = 'bar-col';
    const h = v > 0 ? Math.max(8, Math.round((v / max) * 100)) : 4;
    col.innerHTML = `<div style="flex:1;display:flex;align-items:flex-end;width:100%"><div class="bar-col-fill" style="height:${h}%;background:${v > 0 ? '#457b9d' : 'var(--border)'}"></div></div><div class="bar-col-label">${LABELS[i]}</div>`;
    chart.appendChild(col);
  });
}

function updateCompanyKPIs() {
  const periodActs = allActivities.filter(a => a.period === currentPeriod);

  // Kart 1: Bu Haftanın Toplantıları
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7));
  const weeklyMeetings = allActivities.filter(a => a.fieldKey === 'randevu' && new Date(a.createdAt) >= startOfWeek && new Date(a.createdAt) <= endOfWeek).length;
  const tcEl = document.getElementById('totalCustomers');
  if (tcEl) tcEl.textContent = weeklyMeetings;

  // Kart 2: Toplam Teklif
  const totalTeklif = periodActs.filter(a => a.fieldKey === 'teklif').length;
  const toEl = document.getElementById('totalOffers');
  if (toEl) toEl.textContent = totalTeklif;

  // Kart 3: Günlük Ortalama CRM
  const totalCRM = periodActs.length;
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysPassed = Math.max(1, Math.ceil((today - monthStart) / (1000 * 60 * 60 * 24)));
  const dailyAvg = (totalCRM / daysPassed).toFixed(1);
  const daEl = document.getElementById('dailyAvgCRM');
  if (daEl) daEl.textContent = dailyAvg;
  const tcrmEl = document.getElementById('totalCRMCount');
  if (tcrmEl) tcrmEl.textContent = totalCRM;

  // Kart 4: OKR Özeti
  const okrTotal = periodActs.length; // Basitleştirilmiş OKR metrisi
  const okrTarget = 100;
  const crEl = document.getElementById('conversionRate');
  if (crEl) crEl.textContent = `${okrTotal}/${okrTarget}`;

  // renderBadges(totalMusteri, totalCRM); // Eski badges sistemi kaldırıldı veya devre dışı
}

