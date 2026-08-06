function renderActivities() {
  const list = document.getElementById('activityList');
  const filtered = currentFilter === 'all' ? allActivities : allActivities.filter(a => a.memberId === currentFilter);
  if (!filtered.length) { list.innerHTML = '<div class="no-activity">Henüz aktivite yok 📭</div>'; return; }
  list.innerHTML = '';
  
  const page = paginationState['activityList'] || 1;
  const perPage = 5;
  const start = (page - 1) * perPage;
  const paged = filtered.slice(start, start + perPage);
  
  paged.forEach(a => {
    const canDel = canDeleteActivity();
    const canEdit = canEditActivity(a.memberId);
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="activity-avatar" style="background:${a.memberBg || '#f0f0f0'};color:${a.memberColor || '#333'}">${a.memberInitials || '?'}</div>
      <div class="activity-body">
        <div class="activity-header">
          <span class="activity-name">${a.memberName}</span>
          <span class="activity-field" style="color:${a.memberColor};border-color:${a.memberColor}33;background:${a.memberColor}11">${a.fieldEmoji} ${a.fieldLabel}</span>
          <span class="activity-time">${timeAgo(a.createdAt)}</span>
          <div style="margin-left:auto;display:flex;gap:0.3rem">
            ${canEdit ? `<button onclick="openEditModal('${a.id}')" style="background:none;border:1px solid var(--border);cursor:pointer;color:var(--ink3);font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px">✏️ Düzenle</button>` : ''}
            ${canDel ? `<button onclick="deleteActivity('${a.id}','${a.memberId}','${a.fieldKey}')" style="background:none;border:1px solid var(--border);cursor:pointer;color:var(--ink3);font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:6px">🗑 Sil</button>` : ''}
          </div>
        </div>
        <div class="activity-desc">${a.desc}</div>
        ${a.company ? `<div class="activity-customer">🏢 <span>${a.company}</span></div>` : ''}
        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.3rem">
          ${a.status ? `<span class="status-badge ${a.status === 'Tamamlandı' ? 'status-done' : a.status === 'Takip' ? 'status-takip' : 'status-beklemede'}">${a.status === 'Tamamlandı' ? '✅' : a.status === 'Takip' ? '🔄' : '⏳'} ${a.status}</span>` : ''}
          <span style="font-size:0.7rem;color:var(--ink3)">📅 ${a.date}</span>
        </div>
      </div>`;
    list.appendChild(item);
  });
  
  if (filtered.length > perPage) {
    renderPagination(list, 'activityList', filtered.length, perPage);
  }
}

function renderCRM() {
  const personFilter = document.getElementById('crmFilterPerson') ? document.getElementById('crmFilterPerson').value : 'all';
  const statusFilter = document.getElementById('crmFilterStatus') ? document.getElementById('crmFilterStatus').value : 'all';
  const vipFilter = document.getElementById('crmFilterVIP') ? document.getElementById('crmFilterVIP').value : 'all';
  const categoryFilter = document.getElementById('crmFilterCategory') ? document.getElementById('crmFilterCategory').value : 'all';
  const searchEl = document.getElementById('crmSearch');
  const search = searchEl ? searchEl.value.trim().toLowerCase() : '';

  const startDateStr = document.getElementById('crmFilterStartDate') ? document.getElementById('crmFilterStartDate').value : '';
  const endDateStr = document.getElementById('crmFilterEndDate') ? document.getElementById('crmFilterEndDate').value : '';

  let filtered = allActivities.filter(a => {
    if (personFilter !== 'all' && a.memberId !== personFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (vipFilter === 'vip' && !a.vip) return false;
    if (categoryFilter !== 'all' && a.fieldKey !== categoryFilter) return false;
    if (search && !((a.company || '').toLowerCase().includes(search)) && !((a.desc || '').toLowerCase().includes(search))) return false;
    if (startDateStr && a.date && a.date < startDateStr) return false;
    if (endDateStr && a.date && a.date > endDateStr) return false;
    return true;
  });

  const cols = {
    'Beklemede': { el: document.getElementById('kb-cards-beklemede'), count: 0 },
    'Takip': { el: document.getElementById('kb-cards-takip'), count: 0 },
    'Tamamlandı': { el: document.getElementById('kb-cards-tamamlandi'), count: 0 }
  };

  if (cols['Beklemede'].el) cols['Beklemede'].el.innerHTML = '';
  if (cols['Takip'].el) cols['Takip'].el.innerHTML = '';
  if (cols['Tamamlandı'].el) cols['Tamamlandı'].el.innerHTML = '';

  if (!filtered.length) {
    if (cols['Beklemede'].el) cols['Beklemede'].el.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--ink3);font-size:0.8rem">Kayıt bulunamadı 📭</div>';
  } else {
    const memberColors = { esma: '#e63946', dilan: '#8b5cf6', melek: '#f59e0b', elif: '#457b9d' };

    const grouped = { 'Beklemede': [], 'Takip': [], 'Tamamlandı': [] };
    filtered.forEach(a => {
      const st = a.status || 'Beklemede';
      if (grouped[st]) grouped[st].push(a);
      const colObj = cols[st] || cols['Beklemede'];
      colObj.count++;
    });

    ['Beklemede', 'Takip', 'Tamamlandı'].forEach(st => {
      const colObj = cols[st];
      if (!colObj.el) return;
      const list = grouped[st];
      const page = paginationState['kb_' + st] || 1;
      const perPage = 5;
      const start = (page - 1) * perPage;
      const paged = list.slice(start, start + perPage);

      paged.forEach(a => {
        const companyEsc = (a.company || '').replace(/'/g, "\\'");
        const card = document.createElement('div');
        card.className = 'kanban-card kanban-glow-target';
        const canEdit = canEditActivity(a.memberId);
        if (canEdit) {
          card.draggable = true;
          card.ondragstart = (e) => kbDragStart(e, a.id);
          card.ondragend = (e) => kbDragEnd(e);
        }
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4rem;">
            <div class="kanban-card-title" style="cursor:pointer;color:var(--accent2)" onclick="showCompanyDetail('${companyEsc}')">${a.vip ? '⭐ ' : ''}${a.company || 'Genel'}</div>
            <div style="display:flex;gap:0.4rem;align-items:center;">
              <span style="font-size:0.7rem;color:var(--ink3)">📅 ${a.date || ''}</span>
              ${canEdit ? `<span onclick="openEditModal('${a.id}')" style="cursor:pointer;font-size:0.7rem;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:0.1rem 0.3rem;" title="Düzenle">✏️</span>` : ''}
            </div>
          </div>
          <div class="kanban-card-desc">${a.desc || '—'}</div>
          ${a.nextStep ? `<div style="font-size:0.75rem;color:var(--accent2);margin-bottom:0.5rem">→ ${a.nextStep}</div>` : ''}
          <div class="kanban-card-footer">
            <div style="display:flex;align-items:center;gap:0.4rem">
               <div class="avatar" style="width:20px;height:20px;font-size:0.6rem;background:${memberColors[a.memberId] || '#ccc'}22;color:${memberColors[a.memberId] || '#ccc'};border-radius:50%;display:flex;align-items:center;justify-content:center;">${a.memberInitials || '?'}</div>
               <span style="font-size:0.75rem;font-weight:600;color:var(--ink2)">${a.memberName}</span>
            </div>
            <span style="font-size:0.7rem;background:var(--bg);border:1px solid var(--border);padding:0.15rem 0.4rem;border-radius:6px;font-weight:500;">${a.fieldEmoji || ''} ${a.fieldLabel || ''}</span>
          </div>
        `;
        colObj.el.appendChild(card);
      });
      if (list.length > perPage) {
        renderPagination(colObj.el, 'kb_' + st, list.length, perPage);
      }
    });
  }

  const cB = document.getElementById('kb-count-beklemede'); if (cB) cB.textContent = cols['Beklemede'].count;
  const cT = document.getElementById('kb-count-takip'); if (cT) cT.textContent = cols['Takip'].count;
  const cD = document.getElementById('kb-count-tamamlandi'); if (cD) cD.textContent = cols['Tamamlandı'].count;

  const done = cols['Tamamlandı'].count;
  const takip = cols['Takip'].count;
  const bekle = cols['Beklemede'].count;
  const vips = filtered.filter(a => a.vip).length;
  const statsEl = document.getElementById('crmStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="crm-stat" style="color:#2a9d8f">✅ ${done} Tamamlandı</div>
      <div class="crm-stat" style="color:#457b9d">🔄 ${takip} Takip</div>
      <div class="crm-stat" style="color:#f4a261">⏳ ${bekle} Beklemede</div>
      ${vips ? `<div class="crm-stat" style="color:var(--gold)">⭐ ${vips} VIP</div>` : ''}
    `;
  }
}
