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

function getMemberLastActivityInfo(mid) {
  const memberActs = (allActivities || []).filter(a => a.memberId === mid && a.createdAt);
  if (!memberActs || memberActs.length === 0) {
    return { text: '🚨 Henüz aktivite kaydı yok', isWarning: true };
  }
  
  memberActs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const latest = memberActs[0];
  if (!latest || !latest.createdAt) {
    return { text: '🚨 Henüz aktivite kaydı yok', isWarning: true };
  }

  const actDate = new Date(latest.createdAt);
  const now = new Date();
  const isToday = actDate.toDateString() === now.toDateString();

  if (isToday) {
    const timeStr = actDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return { text: `Son aktivite: Bugün ${timeStr}`, isWarning: false };
  } else {
    const dateStr = actDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return { text: `🚨 Bugün aktivite girmedi (Son: ${dateStr})`, isWarning: true };
  }
}

function nudgeMember(mid) {
  const m = TEAM_DEF.find(x => x.id === mid);
  if (!m) return;

  const btn = document.getElementById(`nudge_btn_${mid}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⚡ Hatırlatıldı ✔';
    btn.style.opacity = '0.7';
  }

  if (typeof db !== 'undefined' && db) {
    db.collection('nudges').add({
      targetMemberId: mid,
      fromName: currentUser ? currentUser.name : 'Yönetici',
      createdAt: new Date().toISOString(),
      read: false
    }).then(() => {
      showToast(`${m.name} için aktivite hatırlatması gönderildi! ⚡`, 'success');
    }).catch(err => {
      console.error('Nudge error:', err);
      showToast(`${m.name} için hatırlatma iletildi.`, 'info');
    });
  } else {
    showToast(`${m.name} için aktivite hatırlatması gönderildi! ⚡`, 'success');
  }
}

function checkMemberNudges() {
  if (!currentUser || !currentUser.memberId || currentUser.role === 'admin') return;
  if (typeof db === 'undefined' || !db) return;

  db.collection('nudges')
    .where('targetMemberId', '==', currentUser.memberId)
    .where('read', '==', false)
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          doc.ref.update({ read: true });
        });
        showToast('🔔 Yöneticiniz günlük performans güncellemenizi bekliyor!', 'warning');
      }
    }).catch(e => console.log('Nudge check error:', e));
}

function renderTeam() {
  const grid = document.getElementById('teamGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Gizlilik Kuralı: Yönetici değilse SADECE kendi kartını görsün
  const visibleMembers = isAdmin
    ? TEAM_DEF
    : TEAM_DEF.filter(m => currentUser && m.id === currentUser.memberId);

  visibleMembers.forEach((m, i) => {
    const canAdd = canAddActivity(m.id);
    const card = document.createElement('div');
    card.className = 'member-card';
    card.style.animationDelay = (0.07 * i) + 's';
    
    // Karta tıklandığında detay modalı açılır
    card.setAttribute('onclick', `if(event.target.tagName !== 'BUTTON') openMemberDetailModal('${m.id}')`);
    card.style.cursor = 'pointer';

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
    const lastActInfo = getMemberLastActivityInfo(m.id);

    // Yönetici için Verimlilik Rozeti
    let effBadgeHtml = '';
    if (isAdmin) {
      const effColor = overall >= 80 ? '#2a9d8f' : (overall >= 50 ? '#f4a261' : '#e63946');
      const effLabel = overall >= 80 ? 'Yüksek' : (overall >= 50 ? 'Normal' : 'Düşük / Riskli');
      effBadgeHtml = `<span style="font-size:0.68rem; font-weight:700; background:${effColor}18; color:${effColor}; border:1px solid ${effColor}40; padding:0.25rem 0.6rem; border-radius:99px; display:inline-flex; align-items:center; gap:0.3rem;">
        <span style="width:6px;height:6px;border-radius:50%;background:${effColor};display:inline-block;"></span>
        Verimlilik: %${overall} (${effLabel})
      </span>`;
    }

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid ${m.deptColor}33;box-shadow:0 2px 10px rgba(0,0,0,0.12);">`
      : `<div class="avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>`;

    card.innerHTML = `
      <div class="member-header" style="flex-wrap:wrap; gap:0.5rem; align-items:flex-start;">
        ${avatarHtml}
        <div class="member-info" style="flex:1; min-width:120px;">
          <h3 style="display:flex; align-items:center; gap:0.4rem; font-size:0.95rem;">${m.name}</h3>
          <span style="font-size:0.68rem; color:var(--ink3);">${m.title || m.dept}</span>
          ${effBadgeHtml ? `<div style="margin-top:0.35rem;">${effBadgeHtml}</div>` : ''}
        </div>
        <div class="dept-tag" style="color:${m.deptColor};border-color:${m.deptColor}33;background:${m.deptColor}11">${m.dept}</div>
      </div>

      ${isAdmin ? `
        <div style="font-size:0.72rem; padding:0.4rem 0.65rem; border-radius:8px; background:${lastActInfo.isWarning ? 'rgba(230,57,70,0.08)' : 'rgba(42,157,143,0.08)'}; color:${lastActInfo.isWarning ? '#e63946' : '#2a9d8f'}; border:1px solid ${lastActInfo.isWarning ? 'rgba(230,57,70,0.2)' : 'rgba(42,157,143,0.2)'}; margin-top:0.5rem; margin-bottom:0.75rem; font-weight:600; display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
          <span style="display:flex; align-items:center; gap:0.3rem;">${lastActInfo.text}</span>
          <button id="nudge_btn_${m.id}" onclick="event.stopPropagation(); nudgeMember('${m.id}')" style="background:var(--accent); color:white; border:none; border-radius:6px; padding:0.25rem 0.65rem; font-size:0.68rem; font-weight:700; cursor:pointer; transition:all 0.2s; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.15);">⚡ Aktivite İste</button>
        </div>
      ` : ''}

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

  if (currentTeamTab === 'matrix') {
    renderTeamMatrix();
  } else if (currentTeamTab === 'okr') {
    renderTeamOkrMatrix();
  }
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

/* ── TAB & MATRIX & DETAILS MODAL MANTIGI ── */
let currentTeamTab = 'cards';

function switchTeamDashboardTab(tab) {
  currentTeamTab = tab;
  
  ['cards', 'matrix', 'okr'].forEach(t => {
    const btn = document.getElementById('btnTeamTab-' + t);
    if (btn) {
      if (t === tab) {
        btn.classList.add('active');
        btn.style.background = 'var(--accent)';
        btn.style.color = 'white';
      } else {
        btn.classList.remove('active');
        btn.style.background = 'var(--bg)';
        btn.style.color = 'var(--ink2)';
      }
    }
  });

  const cardsArea = document.getElementById('team-cards-area');
  const matrixArea = document.getElementById('team-matrix-area');
  const okrArea = document.getElementById('team-okr-area');
  
  if (cardsArea) cardsArea.style.display = tab === 'cards' ? 'block' : 'none';
  if (matrixArea) matrixArea.style.display = tab === 'matrix' ? 'block' : 'none';
  if (okrArea) okrArea.style.display = tab === 'okr' ? 'block' : 'none';

  if (tab === 'matrix') {
    renderTeamMatrix();
  } else if (tab === 'okr') {
    if (typeof renderIRCampaign === 'function') renderIRCampaign();
    else renderTeamOkrMatrix();
  }
}

function renderTeamMatrix() {
  const container = document.getElementById('teamMatrixTableBody');
  if (!container) return;

  container.innerHTML = TEAM_DEF.map(m => {
    const memberColor = m.id === 'admin' ? '#0d1f61' : (m.deptColor || '#ccc');
    const overall = calcOverall(m.id);
    
    const acts = allActivities.filter(a => a.memberId === m.id);
    const closedRevenue = acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
    
    let temas = 0, randevular = 0, teklifler = 0;
    if (m.dept === 'Satış') {
      temas = liveData[m.id]['temas']?.actual || 0;
      randevular = liveData[m.id]['randevu']?.actual || 0;
      teklifler = liveData[m.id]['teklif']?.actual || 0;
    } else {
      temas = (liveData[m.id]['linkedin']?.actual || 0) + (liveData[m.id]['twitter']?.actual || 0) + (liveData[m.id]['instagram']?.actual || 0);
      randevular = liveData[m.id]['haber']?.actual || 0;
      teklifler = liveData[m.id]['youtube']?.actual || 0;
    }

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:28px; height:28px; border-radius:8px; object-fit:cover;">`
      : `<div class="avatar" style="width:28px; height:28px; font-size:10px; line-height:28px; background:${m.avatarBg}; color:${m.deptColor}">${m.initials}</div>`;

    return `
      <tr onclick="openMemberDetailModal('${m.id}')" style="cursor:pointer;">
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${avatarHtml}
            <span style="font-weight:700; color:var(--ink);">${m.name}</span>
          </div>
        </td>
        <td>
          <span class="dept-tag" style="color:${m.deptColor}; border-color:${m.deptColor}33; background:${m.deptColor}11; font-size:0.7rem; padding:0.15rem 0.5rem;">${m.dept}</span>
        </td>
        <td style="font-weight:600;">📞 ${temas}</td>
        <td style="font-weight:600;">🤝 ${randevular}</td>
        <td style="font-weight:600;">📄 ${teklifler}</td>
        <td style="font-weight:800; color:var(--green);">${closedRevenue.toLocaleString('tr-TR')} ₺</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:50px; height:6px; background:var(--border); border-radius:99px; overflow:hidden;">
              <div style="width:${overall}%; height:100%; background:${pctColor(overall)}; border-radius:99px;"></div>
            </div>
            <strong style="color:${pctColor(overall)}; font-size:0.8rem;">%${overall}</strong>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderTeamOkrMatrix() {
  const container = document.getElementById('teamOkrTableBody');
  if (!container) return;

  const isAdmin = currentUser && currentUser.role === 'admin';
  const saveBtn = document.getElementById('btnSaveAllOkrTargets');
  if (saveBtn) saveBtn.style.display = isAdmin ? 'inline-block' : 'none';

  container.innerHTML = TEAM_DEF.map(m => {
    const okrData = allOKR[m.id];
    const objectives = okrData ? okrData.objectives : getOKRDefaults(m.id);
    
    const inputsHtml = objectives.map((obj, idx) => {
      let actualVal = 0;
      const acts = allActivities.filter(a => a.memberId === m.id);
      
      if (m.dept === 'Satış') {
        if (obj.key === 'firsat_hedef') actualVal = acts.filter(a => a.fieldKey === 'firsat').length;
        if (obj.key === 'teklif_hedef') actualVal = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).length;
        if (obj.key === 'kazanma_hedef') {
          const sumT = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).reduce((sm, a) => sm + (a.value || 0), 0);
          const sumK = acts.filter(a => a.fieldKey === 'kazanildi').reduce((sm, a) => sm + (a.value || 0), 0);
          actualVal = sumT > 0 ? Math.round((sumK / sumT) * 100) : 0;
        }
        if (obj.key === 'kayip_analiz') {
          const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
          actualVal = kayiplar.length > 0 ? Math.round((kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length / kayiplar.length) * 100) : 0;
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        actualVal = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }

      const isPct = obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz';
      
      return `
        <td>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.72rem; color:var(--ink3); font-weight:600; line-height:1.2; display:block; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${obj.label}">${obj.label}</span>
            <div style="display:flex; align-items:center; gap:0.4rem;">
              <span style="font-size:0.75rem; font-weight:700; color:var(--ink2)">Fiili: ${actualVal}${isPct ? '%' : ''}</span>
              ${isAdmin ? `
                <input type="number" min="0" value="${obj.target || 0}" 
                  id="matrix_okr_${m.id}_${idx}"
                  style="width:55px; padding:0.2rem; border:1px solid var(--border); border-radius:6px; font-size:0.72rem; background:var(--bg); color:var(--ink); text-align:center;">
              ` : `<span style="font-size:0.75rem; font-weight:700; color:var(--accent)">Hedef: ${obj.target}${isPct ? '%' : ''}</span>`}
            </div>
          </div>
        </td>
      `;
    }).join('');

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:28px; height:28px; border-radius:8px; object-fit:cover;">`
      : `<div class="avatar" style="width:28px; height:28px; font-size:10px; line-height:28px; background:${m.avatarBg}; color:${m.deptColor}">${m.initials}</div>`;

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${avatarHtml}
            <span style="font-weight:700; color:var(--ink);">${m.name}</span>
          </div>
        </td>
        <td>
          <span class="dept-tag" style="color:${m.deptColor}; border-color:${m.deptColor}33; background:${m.deptColor}11; font-size:0.7rem; padding:0.15rem 0.5rem;">${m.dept}</span>
        </td>
        ${inputsHtml}
      </tr>
    `;
  }).join('');
}

function saveAllOKRTargets() {
  if (!currentUser || currentUser.role !== 'admin') return;

  const saveBtn = document.getElementById('btnSaveAllOkrTargets');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Kaydediliyor...';
  }

  const promises = TEAM_DEF.map(m => {
    const okrData = allOKR[m.id] || { memberId: m.id, period: currentPeriod, objectives: getOKRDefaults(m.id) };
    okrData.period = currentPeriod;
    okrData.memberId = m.id;
    
    okrData.objectives.forEach((obj, idx) => {
      const input = document.getElementById(`matrix_okr_${m.id}_${idx}`);
      if (input) {
        obj.target = parseInt(input.value) || 0;
      }
    });

    return db.collection('okr_targets').doc(`${currentPeriod}_${m.id}`).set(okrData);
  });

  Promise.all(promises)
    .then(() => {
      showToast('Tüm OKR hedefleri başarıyla kaydedildi! 🎯', 'success');
      if (typeof renderOKRSection === 'function') renderOKRSection();
      renderTeamOkrMatrix();
    })
    .catch(err => {
      console.error('OKR toplu kayıt hatası:', err);
      showToast('OKR kaydedilirken hata oluştu: ' + err.message, 'error');
    })
    .finally(() => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Tüm OKR Hedeflerini Kaydet';
      }
    });
}

function openMemberDetailModal(memberId) {
  const modal = document.getElementById('memberDetailModal');
  if (!modal) return;

  const m = TEAM_DEF.find(x => x.id === memberId);
  if (!m) return;

  document.getElementById('mDetailName').textContent = m.name;
  document.getElementById('mDetailTitle').textContent = m.title || m.dept;
  
  const deptTag = document.getElementById('mDetailDeptTag');
  if (deptTag) {
    deptTag.textContent = m.dept;
    deptTag.style.color = m.deptColor;
    deptTag.style.borderColor = m.deptColor + '33';
    deptTag.style.background = m.deptColor + '11';
  }

  const photoWrap = document.getElementById('mDetailPhotoWrap');
  if (photoWrap) {
    photoWrap.innerHTML = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:64px; height:64px; border-radius:16px; object-fit:cover; border:2px solid ${m.deptColor}33;">`
      : `<div class="avatar" style="width:64px; height:64px; font-size:20px; line-height:64px; background:${m.avatarBg}; color:${m.deptColor}">${m.initials}</div>`;
  }

  const funnelContainer = document.getElementById('mDetailFunnelContainer');
  const acts = allActivities.filter(a => a.memberId === memberId);
  
  if (funnelContainer) {
    if (m.dept === 'Satış') {
      const arama = acts.filter(a => a.fieldKey === 'temas').length;
      const randevu = acts.filter(a => a.fieldKey === 'randevu').length;
      const teklif = acts.filter(a => a.fieldKey === 'teklif').length;
      const kazanildi = acts.filter(a => a.fieldKey === 'kazanildi').length;
      
      const formatPct = (num, den) => den > 0 ? Math.round((num / den) * 100) : 0;

      funnelContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
            <span>📞 Toplam Arama/Temas</span>
            <span>${arama}</span>
          </div>
          <div style="height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
            <div style="width:100%; height:100%; background:#457b9d; border-radius:99px;"></div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.4rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
            <span>🤝 Toplantı / Randevu</span>
            <span>${randevu} <span style="font-size:0.7rem; color:var(--ink3); font-weight:400;">(Dönüşüm: %${formatPct(randevu, arama)})</span></span>
          </div>
          <div style="height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
            <div style="width:${formatPct(randevu, arama)}%; height:100%; background:#f59e0b; border-radius:99px;"></div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.4rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
            <span>📄 Gönderilen Teklifler</span>
            <span>${teklif} <span style="font-size:0.7rem; color:var(--ink3); font-weight:400;">(Dönüşüm: %${formatPct(teklif, randevu)})</span></span>
          </div>
          <div style="height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
            <div style="width:${formatPct(teklif, randevu)}%; height:100%; background:#8b5cf6; border-radius:99px;"></div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.4rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
            <span>🏆 Kazanılan Satışlar</span>
            <span>${kazanildi} <span style="font-size:0.7rem; color:var(--ink3); font-weight:400;">(Dönüşüm: %${formatPct(kazanildi, teklif)})</span></span>
          </div>
          <div style="height:8px; background:var(--border); border-radius:99px; overflow:hidden;">
            <div style="width:${formatPct(kazanildi, teklif)}%; height:100%; background:var(--green); border-radius:99px;"></div>
          </div>
        </div>
      `;
    } else {
      const linkedin = acts.filter(a => a.fieldKey === 'linkedin').length;
      const twitter = acts.filter(a => a.fieldKey === 'twitter').length;
      const instagram = acts.filter(a => a.fieldKey === 'instagram').length;
      const haber = acts.filter(a => a.fieldKey === 'haber').length;
      
      const total = linkedin + twitter + instagram + haber;
      const pct = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

      funnelContainer.innerHTML = `
        <div style="font-size:0.75rem; color:var(--ink3); font-weight:600; margin-bottom:0.5rem; text-align:center;">Toplam İçerik Dağılımı (${total} Paylaşım)</div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>💼 LinkedIn Paylaşımları</span>
          <span>${linkedin} (%${pct(linkedin)})</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>🐦 Twitter / X Paylaşımları</span>
          <span>${twitter} (%${pct(twitter)})</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>📸 Instagram Paylaşımları</span>
          <span>${instagram} (%${pct(instagram)})</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>📰 Haber Yayınları</span>
          <span>${haber} (%${pct(haber)})</span>
        </div>
      `;
    }
  }

  const feedContainer = document.getElementById('mDetailFeed');
  if (feedContainer) {
    const lastFive = acts.slice(0, 5);
    if (lastFive.length === 0) {
      feedContainer.innerHTML = '<div style="text-align:center; color:var(--ink3); font-size:0.78rem; padding:1.5rem;">Bu dönemde henüz aktivite kaydedilmemiş.</div>';
    } else {
      feedContainer.innerHTML = lastFive.map(a => `
        <div style="background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:0.6rem 0.8rem; border-left:3px solid ${m.deptColor}">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <span style="font-size:0.78rem; font-weight:700; color:var(--ink);">🏢 ${a.company || 'Genel'}</span>
            <span style="font-size:0.68rem; color:var(--ink3);">📅 ${a.date}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--ink2); line-height:1.4;">${a.desc}</div>
        </div>
      `).join('');
    }
  }

  const okrListContainer = document.getElementById('mDetailOkrList');
  if (okrListContainer) {
    const okrData = allOKR[memberId];
    const objectives = okrData ? okrData.objectives : getOKRDefaults(memberId);
    
    okrListContainer.innerHTML = objectives.map((obj, idx) => {
      let autoActual = 0;
      let displayTarget = obj.target;

      if (m.dept === 'Satış') {
        if (obj.key === 'firsat_hedef') {
          autoActual = acts.filter(a => a.fieldKey === 'firsat').length;
        } else if (obj.key === 'teklif_hedef') {
          autoActual = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).length;
        } else if (obj.key === 'kazanma_hedef') {
          const sumTeklif = acts.filter(a => a.fieldKey === 'teklif' && a.isOkr === true).reduce((s, a) => s + (a.value || 0), 0);
          const sumKazanildi = acts.filter(a => a.fieldKey === 'kazanildi').reduce((s, a) => s + (a.value || 0), 0);
          autoActual = sumTeklif > 0 ? Math.round((sumKazanildi / sumTeklif) * 100) : 0;
          displayTarget = obj.target + '%';
        } else if (obj.key === 'kayip_analiz') {
          const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
          autoActual = kayiplar.length > 0 ? Math.round((kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length / kayiplar.length) * 100) : 0;
          displayTarget = obj.target + '%';
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        autoActual = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }

      let p = obj.target > 0 ? Math.min(100, Math.round((autoActual / obj.target) * 100)) : 0;
      const isPctDisplay = obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz';
      const color = pctColor(p);
      
      return `
        <div style="background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:0.8rem; color:var(--ink);">${obj.label}</strong>
            <span style="font-size:0.8rem; font-weight:800; color:${color};">${isPctDisplay ? autoActual + '%' : autoActual} <span style="font-size:0.72rem; color:var(--ink3); font-weight:400;">/ ${displayTarget}</span></span>
          </div>
          <div style="height:6px; background:var(--border); border-radius:99px; overflow:hidden;">
            <div style="width:${p}%; height:100%; background:${color}; border-radius:99px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--ink3);">
            <span>Tamamlanma Oranı: %${p}</span>
            <span>Hedef Başarı</span>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
}

function closeMemberDetailModal() {
  const modal = document.getElementById('memberDetailModal');
  if (modal) modal.classList.add('hidden');
}
