function toggleExportMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('exportMenu');
  const isOpen = menu.style.display !== 'none';
  menu.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    setTimeout(() => document.addEventListener('click', closeExportMenu, { once: true }), 0);
  }
}
function closeExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';
}


function exportToPDF() {
  if (currentUser.role !== 'admin') return;
  showToast('PDF hazırlanıyor...', 'success');

  const el = document.getElementById('tab-dashboard');

  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `IdealData_Ozet_${currentPeriod}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 1.5,
      useCORS: true,
      allowTaint: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.offsetWidth,
      logging: false,
      imageTimeout: 0,
    },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  const clone = el.cloneNode(true);
  clone.style.cssText = 'display:block!important;position:static!important;animation:none!important;transform:none!important;';
  clone.querySelectorAll('*').forEach(n => {
    n.style.animation = 'none';
    n.style.transition = 'none';
    n.style.transform = 'none';
  });
  document.body.appendChild(clone);

  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(clone);
    showToast('PDF indirildi!', 'success');
  }).catch(e => {
    document.body.removeChild(clone);
    showToast('PDF hatası: ' + e.message, 'error');
  });
}

function exportToExcel() {
  if (currentUser.role !== 'admin') return;
  if (typeof XLSX === 'undefined') { showToast('Excel kütüphanesi yüklenmedi, lütfen internet bağlantısını kontrol edin.', 'error'); return; }
  const headers = ['Kişi', 'Departman', 'Kategori', 'Kurum', 'Durum', 'Açıklama', 'Sonraki Adım', 'Tarih', 'Dönem'];
  const rows = allActivities.map(a => [
    a.memberName || '', a.dept || '', a.fieldLabel || '',
    a.company || '', a.status || '', a.desc || '',
    a.nextStep || '', a.date || '', a.period || ''
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [18, 18, 18, 28, 14, 40, 30, 12, 12].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Aktiviteler');
  XLSX.writeFile(wb, `idealdata_aktiviteler_${currentPeriod}.xlsx`);
  showToast('Excel dosyası indirildi!', 'success');
}

function renderTeam() {
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = '';
  TEAM_DEF.forEach((m, i) => {
    const canAdd = canAddActivity(m.id);
    const card = document.createElement('div');
    card.className = 'member-card';
    card.style.animationDelay = (0.07 * i) + 's';
    let fieldsHtml = '';
    m.fields.forEach(f => {
      const val = liveData[m.id][f.key];
      const p = f.hasTarget ? pct(val.actual, val.target) : null;
      const color = f.hasTarget ? pctColor(p ?? 0) : 'var(--ink3)';
      fieldsHtml += `<div style="display:flex; flex-direction:column; gap:0.25rem; background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:0.5rem 0.75rem; border-radius:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:600; color:var(--ink2)">${f.emoji} ${f.label}</span>
          <span style="font-size:0.75rem; font-weight:700; color:${color}" id="cnt_${m.id}_${f.key}">${val.actual}</span>
        </div>
        ${f.hasTarget ? `
          <div style="height:5px; background:var(--border); border-radius:99px; overflow:hidden; margin-top:0.15rem;">
            <div id="bar_field_${m.id}_${f.key}" style="height:100%; width:${p}%; background:${color}; border-radius:99px; transition:width 0.5s;"></div>
          </div>
        ` : ''}
      </div>`;
    });
    const overall = calcOverall(m.id);
    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid ${m.deptColor}33;box-shadow:0 2px 10px rgba(0,0,0,0.12);">`
      : `<div class="avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>`;
    card.innerHTML = `
      <div class="member-header">
        ${avatarHtml}
        <div class="member-info"><h3>${m.name}</h3><span style="font-size:0.68rem">${m.title || m.dept}</span></div>
        <div class="dept-tag" style="color:${m.deptColor};border-color:${m.deptColor}33;background:${m.deptColor}11">${m.dept}</div>
      </div>
      <div class="member-card-right">
        <div class="member-fields-grid">${fieldsHtml}</div>
        <div class="member-bar"><div class="bar-track"><div class="bar-fill" id="bar_${m.id}" style="width:${overall}%;background:${pctColor(overall)}"></div></div></div>
        <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
          ${canAdd ? `<button class="add-activity-btn" style="flex:1" onclick="openModal('${m.id}')">+ Aktivite Ekle</button>` : '<div style="flex:1;text-align:center;font-size:0.72rem;color:var(--ink3)">🔒 Sadece görüntüleme</div>'}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function updateCard(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  m.fields.forEach(f => {
    const val = liveData[mid][f.key];
    const el = document.getElementById(`cnt_${mid}_${f.key}`);
    if (f.hasTarget) {
      const p = pct(val.actual, val.target);
      const color = pctColor(p);
      if (el) {
        el.textContent = val.actual;
        el.style.color = color;
      }
      const pBar = document.getElementById(`bar_field_${mid}_${f.key}`);
      if (pBar) {
        pBar.style.width = p + '%';
        pBar.style.background = color;
      }

      // %100 ulaşıldığında konfeti patlat (Tek seferlik)
      if (val.target > 0 && val.actual >= val.target) {
        if (el && (!el.dataset.confettiTarget || parseInt(el.dataset.confettiTarget) < val.target)) {
          setTimeout(() => triggerConfetti(), 300);
          el.dataset.confettiTarget = val.target;
        }
      }
    } else {
      if (el) {
        el.textContent = val.actual;
      }
    }
  });
  const bar = document.getElementById('bar_' + mid);
  if (bar) { const ov = calcOverall(mid); bar.style.width = ov + '%'; bar.style.background = pctColor(ov); }
}

function saveTargets(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  const btn = document.getElementById('savetgt_' + mid);
  if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }
  const data = { memberId: mid, period: currentPeriod, updatedAt: new Date().toISOString() };
  m.fields.forEach(f => {
    const tEl = document.getElementById(`tgt_${mid}_${f.key}`);
    data[f.key] = { actual: liveData[mid][f.key].actual, target: tEl ? (parseInt(tEl.value) || 0) : 0 };
  });
  db.collection('dashboard').doc(`${currentPeriod}_${mid}`).set(data)
    .then(() => { if (btn) { btn.textContent = '✓ Kaydedildi'; btn.classList.add('saved'); } showToast('Hedefler kaydedildi.', 'success'); })
    .catch(e => { if (btn) btn.textContent = 'Hata!'; })
    .finally(() => setTimeout(() => { if (btn) { btn.textContent = 'Hedefleri Kaydet'; btn.classList.remove('saved'); btn.disabled = false; } }, 2000));
}

