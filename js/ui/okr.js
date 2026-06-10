// ====== OKR SİSTEMİ ======

let allOKR = {};

const OKR_DEFAULTS = {
  satis: [
    { key: 'firsat_hedef', label: '🤝 Nitelikli Fırsat Yaratma', target: 0, actual: 0 },
    { key: 'teklif_hedef', label: '📄 Aylık Minimum Teklif Adedi', target: 0, actual: 0 },
    { key: 'kazanma_hedef', label: '✅ Mevduat/Tutar Kapama %20 (Toplam)', target: 20, actual: 0 },
    { key: 'kayip_analiz', label: '❌ Kayıp Satış Analizi %', target: 100, actual: 0 }
  ],
  dijital: [
    { key: 'icerik_hedef', label: '📢 Dijital İçerik', target: 0, actual: 0 },
    { key: 'sosyal_hedef', label: '📱 Sosyal Medya', target: 0, actual: 0 },
    { key: 'haber_hedef', label: '📰 Haber Yayını', target: 0, actual: 0 },
    { key: 'linkedin_hedef', label: '💼 LinkedIn', target: 0, actual: 0 },
  ]
};

function getOKRDefaults(memberId) {
  const m = TEAM_DEF.find(x => x.id === memberId);
  if (!m) return [];
  return m.dept === 'Dijital Pazarlama' ? OKR_DEFAULTS.dijital : OKR_DEFAULTS.satis;
}

function listenToOKR(period) {
  const unsub = db.collection('okr_targets').where('period', '==', period).onSnapshot(snap => {
    allOKR = {};
    snap.forEach(doc => { allOKR[doc.data().memberId] = doc.data(); });
    renderOKRSection();
  });
  unsubscribeFns.push(unsub);
}

function renderOKRSection() {
  const container = document.getElementById('okrSection');
  if (!container) return;

  const isAdmin = currentUser && currentUser.role === 'admin';
  const myId = currentUser && currentUser.memberId;

  const membersToShow = isAdmin ? TEAM_DEF : TEAM_DEF.filter(m => m.id === myId);

  container.innerHTML = membersToShow.map(m => {
    const okrData = allOKR[m.id];
    const objectives = okrData ? okrData.objectives : getOKRDefaults(m.id);
    const acts = allActivities.filter(a => a.memberId === m.id);

    const objHtml = objectives.map((obj, idx) => {
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
          const memberNotes = allLostSaleNotes.filter(n => n.memberId === m.id);
          const listHtml = memberNotes.map(n => `
             <div style="background:var(--surface);border-radius:6px;padding:0.6rem;border:1px solid var(--border);border-left:3px solid #e63946;margin-bottom:0.4rem">
               <div style="font-size:0.8rem;font-weight:700;color:var(--ink);margin-bottom:0.2rem">🏢 ${n.company} <span style="font-size:0.65rem;color:var(--ink3);font-weight:400;float:right">📅 ${n.date}</span></div>
               <div style="font-size:0.75rem;color:var(--ink2);line-height:1.4">${n.note}</div>
             </div>
           `).join('');

          return `
             <div style="margin-bottom:0.4rem;padding:0.75rem;background:var(--bg);border:1px dashed var(--border);border-left:4px solid #e63946;border-radius:12px;">
               <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
                 <span style="font-size:0.78rem;font-weight:700;color:var(--ink)">❌ Kayıp Satış Analizi / Notlar</span>
                 <button onclick="openLostSaleNoteModal('${m.id}')" style="background:#e63946;color:white;border:none;border-radius:6px;font-size:0.65rem;padding:0.25rem 0.5rem;cursor:pointer;font-weight:600">+ Yeni Not Ekle</button>
               </div>
               <div style="max-height:120px;overflow-y:auto;padding-right:0.2rem" class="thin-scroll">
                 ${memberNotes.length ? listHtml : '<div style="font-size:0.7rem;color:var(--ink3);text-align:center;padding:0.5rem;border:1px dashed var(--border);border-radius:6px;">Henüz hiç kayıp satış notu eklenmedi.</div>'}
               </div>
             </div>
           `;
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        autoActual = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }

      let p = obj.target > 0 ? Math.min(100, Math.round((autoActual / obj.target) * 100)) : 0;
      if (obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz') {
        p = obj.target > 0 ? Math.min(100, Math.round((autoActual / obj.target) * 100)) : (autoActual > 0 ? 100 : 0);
      }

      const isPctDisplay = obj.key === 'kazanma_hedef' || obj.key === 'kayip_analiz';
      const color = pctColor(p);
      return `
        <div style="display:flex; flex-direction:column; gap:0.25rem; background:rgba(255,255,255,0.02); border:1px solid var(--border); padding:0.5rem 0.75rem; border-radius:10px; margin-bottom:0.4rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.78rem; font-weight:600; color:var(--ink2)">${obj.label}</span>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.78rem; font-weight:700; color:${color};">${isPctDisplay ? '%' + autoActual : autoActual} <span style="font-size:0.7rem; color:var(--ink3); font-weight:400">/ ${displayTarget || '—'}</span></span>
              ${isAdmin ? `<input type="number" min="0" value="${obj.target || 0}" data-mid="${m.id}" data-idx="${idx}"
                onchange="updateOKRTarget(this)"
                style="width:50px;padding:0.15rem 0.25rem;border:1px solid var(--border);border-radius:6px;font-size:0.72rem;background:var(--bg);color:var(--ink);text-align:center;">` : ''}
            </div>
          </div>
          <div style="height:5px; background:var(--border); border-radius:99px; overflow:hidden; margin-top:0.15rem;">
            <div style="height:100%; width:${p}%; background:${color}; border-radius:99px; transition:width 0.5s;"></div>
          </div>
        </div>`;
    }).join('');

    const totalPct = objectives.length ? Math.round(objectives.reduce((s, obj) => {
      let actualVal = 0;
      if (m.dept === 'Satış') {
        if (obj.key === 'firsat_hedef') actualVal = acts.filter(a => a.fieldKey === 'firsat').length;
        if (obj.key === 'teklif_hedef') actualVal = acts.filter(a => a.fieldKey === 'teklif').length;
        if (obj.key === 'kazanma_hedef') {
          const sumT = acts.filter(a => a.fieldKey === 'teklif').reduce((sm, a) => sm + (a.value || 0), 0);
          const sumK = acts.filter(a => a.fieldKey === 'kazanildi').reduce((sm, a) => sm + (a.value || 0), 0);
          actualVal = sumT > 0 ? (sumK / sumT) * 100 : 0;
        }
        if (obj.key === 'kayip_analiz') {
          const kayiplar = acts.filter(a => a.fieldKey === 'kaybedildi');
          actualVal = kayiplar.length > 0 ? (kayiplar.filter(a => a.desc && a.desc.trim().length > 0).length / kayiplar.length) * 100 : 0;
        }
      } else {
        const keyMap = { icerik_hedef: 'diger', sosyal_hedef: 'twitter', haber_hedef: 'haber', linkedin_hedef: 'linkedin' };
        const fk = keyMap[obj.key];
        actualVal = fk ? acts.filter(a => a.fieldKey === fk).length : (obj.actual || 0);
      }
      return s + (obj.target > 0 ? Math.min(100, (actualVal / obj.target) * 100) : 0);
    }, 0) / objectives.length) : 0;

    const avatarHtml = m.photo
      ? `<img src="${m.photo}" alt="${m.name}" style="width:52px;height:52px;border-radius:14px;object-fit:cover;border:2px solid ${m.deptColor}33;box-shadow:0 2px 10px rgba(0,0,0,0.12);">`
      : `<div class="avatar" style="background:${m.avatarBg};color:${m.deptColor}">${m.initials}</div>`;

    return `
      <div class="member-card">
        <div class="member-header">
          ${avatarHtml}
          <div class="member-info"><h3>${m.name}</h3><span style="font-size:0.68rem">OKR · ${currentPeriod}</span></div>
          <div class="dept-tag" style="color:${m.deptColor};border-color:${m.deptColor}33;background:${m.deptColor}11">${m.dept}</div>
          <div style="font-size:1.4rem;font-weight:800;color:${pctColor(totalPct)};margin-top:0.75rem;">%${totalPct}</div>
        </div>
        <div class="member-card-right">
          <div class="member-fields-grid" style="display:flex;flex-direction:column;gap:0.4rem;flex:1;">
            ${objHtml}
          </div>
          ${isAdmin ? `<button onclick="saveOKR('${m.id}')" style="width:100%;margin-top:0.5rem;padding:0.55rem;border:none;border-radius:10px;background:var(--btn-bg);color:var(--btn-text);font-family:'Outfit',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;transition:background 0.2s;">💾 Hedefleri Kaydet</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

function updateOKRTarget(input) {
  const mid = input.dataset.mid;
  const idx = parseInt(input.dataset.idx);
  if (!allOKR[mid]) allOKR[mid] = { memberId: mid, period: currentPeriod, objectives: getOKRDefaults(mid) };
  if (allOKR[mid].objectives[idx]) allOKR[mid].objectives[idx].target = parseInt(input.value) || 0;
}

function saveOKR(memberId) {
  if (!currentUser || currentUser.role !== 'admin') return;
  const okrData = allOKR[memberId] || { memberId, period: currentPeriod, objectives: getOKRDefaults(memberId) };
  okrData.period = currentPeriod;
  okrData.memberId = memberId;
  db.collection('okr_targets').doc(`${currentPeriod}_${memberId}`).set(okrData)
    .then(() => showToast(`${TEAM_DEF.find(m => m.id === memberId)?.name} OKR hedefleri kaydedildi! ✅`, 'success'))
    .catch(e => showToast('Hata: ' + e.message, 'error'));
}

